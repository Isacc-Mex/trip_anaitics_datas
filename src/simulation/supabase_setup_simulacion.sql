-- ============================================================
-- TRIP — Simulación de datos realista (reemplazo completo)
-- Correr esto UNA vez en el SQL Editor de Supabase. Sustituye
-- por completo simulate_player_matches, simulate_player_purchases
-- y la curva de registro de admin_regenerate_bots. No toca las
-- políticas RLS ni el trigger ya instalados.
--
-- Pensado para un juego indie chico: cientos de usuarios entre
-- 2024-01-01 y hoy, con arranque lento, ruido mes a mes (no una
-- curva perfecta), picos de fin de semana, y jugadores que se
-- comportan de forma realista (la mayoría prueba y se va, pocos
-- se quedan meses).
-- ============================================================

-- ---------------------------------------------------------------
-- 1) Curva de registro orgánica (arranque lento + ruido + fines
--    de semana) en vez de una curva perfectamente suave.
-- ---------------------------------------------------------------
create or replace function admin_regenerate_bots(p_bot_count int default 500)
returns int
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_i int;
  v_user_id uuid;
  v_email text;
  v_username text;
  v_registered_at timestamptz;
  v_start date := date '2024-01-01';
  v_end date := (now() - interval '14 days')::date;
  v_months int;
  v_weights numeric[] := array[]::numeric[];
  v_cum numeric[] := array[]::numeric[];
  v_total numeric := 0;
  v_r numeric;
  v_month_idx int;
  v_month_start date;
  v_days_in_month int;
  v_day_offset int;
  v_candidate date;
  v_weekday int;
  v_weekday_factor numeric;
  v_hour int;
  v_hour_pool int[] := array[13,14,15,16,17,18,19,19,20,20,21,21,22,22,23,0,1,9,10,11];
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  delete from purchases    where user_id in (select id from auth.users where email like 'bot%@gmail.com');
  delete from game_matches where user_id in (select id from auth.users where email like 'bot%@gmail.com');
  delete from progress     where user_id in (select id from auth.users where email like 'bot%@gmail.com');
  delete from profiles     where id in (select id from auth.users where email like 'bot%@gmail.com');
  delete from auth.users   where email like 'bot%@gmail.com';

  v_months := greatest(1,
    (extract(year from age(v_end, v_start)) * 12 + extract(month from age(v_end, v_start)))::int + 1
  );

  -- Peso por mes: crecimiento tipo lanzamiento indie (power curve) más
  -- ruido aleatorio por mes (algunos meses van mejor que otros: updates,
  -- redes sociales, rachas muertas, etc.) — así la curva no sale perfecta.
  for v_month_idx in 0..v_months-1 loop
    v_weights := v_weights || greatest(0.15, power(v_month_idx + 1, 1.4) * (0.55 + random() * 0.9));
  end loop;

  for v_month_idx in 1..array_length(v_weights,1) loop
    v_total := v_total + v_weights[v_month_idx];
    v_cum := v_cum || v_total;
  end loop;

  for v_i in 1..p_bot_count loop
    v_email := 'bot' || v_i || '@gmail.com';
    v_username := 'bot_' || v_i;
    v_user_id := gen_random_uuid();

    v_r := random() * v_total;
    v_month_idx := 1;
    while v_month_idx < array_length(v_cum,1) and v_cum[v_month_idx] < v_r loop
      v_month_idx := v_month_idx + 1;
    end loop;

    v_month_start := (v_start + ((v_month_idx - 1) || ' months')::interval)::date;
    v_days_in_month := extract(day from (date_trunc('month', v_month_start) + interval '1 month' - interval '1 day'));
    if v_month_start + (v_days_in_month - 1) > v_end then
      v_days_in_month := greatest(1, (v_end - v_month_start) + 1);
    end if;

    -- dentro del mes: sesga hacia viernes/sábado/domingo (picos típicos
    -- de un juego casual)
    loop
      v_day_offset := floor(random() * v_days_in_month);
      v_candidate := v_month_start + v_day_offset;
      v_weekday := extract(isodow from v_candidate);
      v_weekday_factor := case when v_weekday in (5,6,7) then 1.0 else 0.55 end;
      exit when random() < v_weekday_factor;
    end loop;

    v_hour := v_hour_pool[1 + floor(random() * array_length(v_hour_pool,1))::int];
    v_registered_at := v_candidate::timestamptz + (v_hour || ' hours')::interval
      + (floor(random() * 60) || ' minutes')::interval;

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt('123456', extensions.gen_salt('bf')),
      v_registered_at,
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('username', v_username),
      v_registered_at, v_registered_at,
      '', '', '', ''
    );

    insert into profiles (id, username, role, created_at)
    values (v_user_id, v_username, 'user', v_registered_at)
    on conflict (id) do update set created_at = excluded.created_at;
  end loop;

  return p_bot_count;
end;
$$;

-- ---------------------------------------------------------------
-- 2) Partidas realistas: segmentos de jugador (la mayoría prueba
--    y se va, pocos se quedan), sesiones agrupadas en el tiempo,
--    progreso por mapas con drop-off, y nunca partidas en el futuro.
-- ---------------------------------------------------------------
create or replace function simulate_player_matches(p_user_id uuid, p_registered_at timestamptz)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier numeric := random();
  v_num_matches int;
  v_maps text[] := array['Calle Vacía','Habitación','Hospital','Callejón','Refugio','Recuerdo'];
  v_deaths text[] := array['enemigos','sobredosis','abstinencia','colapso','caidas'];
  v_now timestamptz := now();
  v_i int;
  v_played_at timestamptz;
  v_session_gap numeric;
  v_last_played timestamptz;
  v_map_idx int;
  v_died boolean;
  v_duration int;
begin
  -- Segmentos típicos de un juego indie:
  --   ~45% prueban y se van (1-3 partidas en los primeros días)
  --   ~35% casuales (5-18 partidas repartidas en semanas)
  --   ~15% regulares (18-45 partidas, juegan por meses)
  --   ~5%  fans (45-90 partidas)
  if v_tier < 0.45 then
    v_num_matches := 1 + floor(random()*3)::int;
  elsif v_tier < 0.80 then
    v_num_matches := 5 + floor(random()*14)::int;
  elsif v_tier < 0.95 then
    v_num_matches := 18 + floor(random()*28)::int;
  else
    v_num_matches := 45 + floor(random()*46)::int;
  end if;

  v_last_played := p_registered_at;

  for v_i in 1..v_num_matches loop
    if v_i = 1 then
      v_played_at := p_registered_at + (floor(random()*180) || ' minutes')::interval;
    else
      if v_tier < 0.45 then
        v_session_gap := random() * 2;
      elsif v_tier < 0.80 then
        v_session_gap := power(random(), 2) * 10;
      elsif v_tier < 0.95 then
        v_session_gap := power(random(), 1.5) * 6;
      else
        v_session_gap := power(random(), 1.8) * 4;
      end if;
      v_played_at := v_last_played + (v_session_gap || ' days')::interval
        + (floor(random()*180) || ' minutes')::interval;
    end if;

    exit when v_played_at > v_now;
    v_last_played := v_played_at;

    -- drop-off de nivel a nivel: cada mapa siguiente tiene menos chance
    v_map_idx := 1;
    while v_map_idx < array_length(v_maps,1) and random() < 0.62 loop
      v_map_idx := v_map_idx + 1;
    end loop;

    v_died := random() < 0.55;
    v_duration := 60 + floor(random()*540)::int;

    insert into game_matches (
      user_id, played_at, duration_seconds, death_type, consumptions,
      map_name, map_number, max_health_end, damage_received
    ) values (
      p_user_id, v_played_at, v_duration,
      case when v_died then v_deaths[1 + floor(random()*array_length(v_deaths,1))::int] else null end,
      floor(random()*6)::int,
      v_maps[v_map_idx], v_map_idx,
      case when v_died then floor(random()*30)::int else 40 + floor(random()*61)::int end,
      floor(random()*100)::int
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------
-- 3) Compras realistas: no todos compran, quien compra suele
--    comprar 1-2 veces, muy pocos son "gastadores".
-- ---------------------------------------------------------------
create or replace function simulate_player_purchases(p_user_id uuid, p_registered_at timestamptz)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_will_buy boolean := random() < 0.28; -- ~28% de los jugadores compra algo
  v_num_purchases int;
  v_i int;
  v_purchased_at timestamptz;
  v_now timestamptz := now();
  v_product record;
  v_span_days numeric;
begin
  if not v_will_buy then
    return;
  end if;

  v_span_days := greatest(1, extract(epoch from (v_now - p_registered_at)) / 86400);

  v_num_purchases := case
    when random() < 0.65 then 1
    when random() < 0.9 then 2
    else 3 + floor(random()*3)::int
  end;

  for v_i in 1..v_num_purchases loop
    v_purchased_at := p_registered_at
      + (power(random(), 1.6) * least(v_span_days, 400) || ' days')::interval
      + (floor(random()*1440) || ' minutes')::interval;

    exit when v_purchased_at > v_now;

    select id, price into v_product from products order by random() limit 1;
    exit when v_product.id is null;

    insert into purchases (user_id, product_id, price_paid, created_at)
    values (p_user_id, v_product.id, coalesce(v_product.price, 0), v_purchased_at);
  end loop;
end;
$$;

grant execute on function simulate_player_matches(uuid, timestamptz) to authenticated;
grant execute on function simulate_player_purchases(uuid, timestamptz) to authenticated;