"""ETL reproducible para los datos analiticos de TRIP."""

from pathlib import Path
from datetime import datetime, timezone

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = PROJECT_ROOT / "data" / "raw"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"

DATE_COLUMNS = {
    "profiles": ["created_at"],
    "products": ["created_at"],
    "purchases": ["created_at"],
    "game_matches": ["played_at"],
    "progress": [],
}

EXPECTED_FILES = ["profiles", "products", "purchases", "game_matches", "progress"]


def read_source(table_name):
    """Read one raw CSV and return an empty frame when it is unavailable."""
    source_path = RAW_DIR / f"{table_name}.csv"
    if not source_path.exists():
        return pd.DataFrame(), {"source": str(source_path), "status": "missing"}

    frame = pd.read_csv(source_path)
    frame.columns = [column.strip().lower() for column in frame.columns]
    return frame, {"source": str(source_path), "status": "available"}


def parse_dates(frame, columns):
    for column in columns:
        if column in frame.columns:
            frame[column] = pd.to_datetime(frame[column], errors="coerce", utc=True)
    return frame


def normalize_text(frame, columns):
    for column in columns:
        if column in frame.columns:
            frame[column] = frame[column].astype("string").str.strip()
    return frame


def numeric_column(frame, column):
    if column in frame.columns:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
    return frame


def base_quality(table_name, raw_frame, processed_frame, source_info):
    return {
        "table": table_name,
        "source": source_info["source"],
        "status": source_info["status"],
        "raw_rows": int(len(raw_frame)),
        "processed_rows": int(len(processed_frame)),
        "rejected_rows": int(len(raw_frame) - len(processed_frame)),
        "raw_duplicates": int(raw_frame.duplicated().sum()) if not raw_frame.empty else 0,
        "processed_nulls": int(processed_frame.isna().sum().sum()) if not processed_frame.empty else 0,
    }


def process_profiles(frame):
    frame = frame.copy()
    frame = parse_dates(frame, DATE_COLUMNS["profiles"])
    frame = normalize_text(frame, ["username", "role"])
    if "role" in frame.columns:
        frame["role"] = frame["role"].str.lower()
    if "id" not in frame.columns:
        return pd.DataFrame(columns=frame.columns)
    frame = frame.dropna(subset=["id"]).drop_duplicates(subset=["id"])
    return frame


def process_products(frame):
    frame = frame.copy()
    frame = parse_dates(frame, DATE_COLUMNS["products"])
    frame = normalize_text(frame, ["name", "description", "type", "image_url", "image_position"])
    frame = numeric_column(frame, "price")
    if "type" in frame.columns:
        frame["type"] = frame["type"].str.lower()
    if "id" not in frame.columns:
        return pd.DataFrame(columns=frame.columns)
    frame = frame.dropna(subset=["id"]).drop_duplicates(subset=["id"])
    if "price" in frame.columns:
        frame = frame[frame["price"].ge(0) | frame["price"].isna()]
    return frame


def process_purchases(frame, profiles, products):
    frame = frame.copy()
    frame = parse_dates(frame, DATE_COLUMNS["purchases"])
    frame = numeric_column(frame, "price_paid")
    if frame.empty:
        return frame

    valid = pd.Series(True, index=frame.index)
    if "id" in frame.columns:
        valid &= frame["id"].notna()
    if "user_id" in frame.columns and not profiles.empty and "id" in profiles.columns:
        valid &= frame["user_id"].isin(profiles["id"])
    if "product_id" in frame.columns and not products.empty and "id" in products.columns:
        valid &= frame["product_id"].isin(products["id"])
    if "price_paid" in frame.columns:
        valid &= frame["price_paid"].ge(0) | frame["price_paid"].isna()

    if "created_at" in frame.columns and "user_id" in frame.columns and "created_at" in profiles.columns:
        registration = profiles.set_index("id")["created_at"]
        registered_at = frame["user_id"].map(registration)
        valid &= frame["created_at"].ge(registered_at) | registered_at.isna()

    return frame.loc[valid].drop_duplicates(subset=["id"] if "id" in frame.columns else None)


def process_matches(frame, profiles):
    frame = frame.copy()
    frame = parse_dates(frame, DATE_COLUMNS["game_matches"])
    frame = normalize_text(frame, ["death_type", "map_name"])
    for column in ["duration_seconds", "consumptions", "map_number", "max_health_end", "damage_received"]:
        frame = numeric_column(frame, column)
    if frame.empty:
        return frame

    valid = pd.Series(True, index=frame.index)
    if "user_id" in frame.columns and not profiles.empty and "id" in profiles.columns:
        valid &= frame["user_id"].isin(profiles["id"])
    if "played_at" in frame.columns:
        valid &= frame["played_at"].notna() & (frame["played_at"] <= pd.Timestamp.now(tz="UTC"))
    for column in ["duration_seconds", "consumptions", "map_number", "max_health_end", "damage_received"]:
        if column in frame.columns:
            valid &= frame[column].ge(0) | frame[column].isna()
    if "max_health_end" in frame.columns:
        valid &= frame["max_health_end"].le(100) | frame["max_health_end"].isna()
    if "user_id" in frame.columns and "played_at" in frame.columns and "created_at" in profiles.columns:
        registration = profiles.set_index("id")["created_at"]
        registered_at = frame["user_id"].map(registration)
        valid &= frame["played_at"].ge(registered_at) | registered_at.isna()

    return frame.loc[valid]


def write_quality_report(records, generated_at):
    report_path = PROCESSED_DIR / "quality_report.md"
    lines = [
        "# Reporte de calidad de datos",
        "",
        f"Fecha de ejecucion: {generated_at}",
        "",
        "Este reporte fue generado automaticamente por `src/etl/run_etl.py`.",
        "Los registros rechazados no se eliminan de los archivos raw; solo se excluyen del dataset procesado.",
        "",
        "| Tabla | Estado | Filas raw | Filas procesadas | Rechazadas | Duplicados raw | Nulos procesados |",
        "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
    ]
    for record in records:
        lines.append(
            f"| `{record['table']}` | {record['status']} | {record['raw_rows']} | "
            f"{record['processed_rows']} | {record['rejected_rows']} | "
            f"{record['raw_duplicates']} | {record['processed_nulls']} |"
        )

    lines.extend(
        [
            "",
            "## Transformaciones aplicadas",
            "",
            "- Normalizacion de nombres de columnas y textos.",
            "- Conversion de fechas a UTC.",
            "- Conversion de medidas y precios a valores numericos.",
            "- Eliminacion de duplicados por identificador cuando existe.",
            "- Validacion de usuarios y productos referenciados.",
            "- Validacion de fechas no futuras y fechas posteriores al registro.",
            "- Validacion de valores no negativos y vida final entre 0 y 100.",
            "",
            "## Interpretacion",
            "",
            "Los archivos con estado `missing` requieren exportarse desde Supabase antes de ejecutar el EDA completo. Los nulos que permanecen en el dataset procesado deben analizarse segun el significado del campo; no se eliminan automaticamente.",
        ]
    )
    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def run_etl():
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    loaded = {}
    source_info = {}
    for table_name in EXPECTED_FILES:
        loaded[table_name], source_info[table_name] = read_source(table_name)

    processed = {}
    processed["profiles"] = process_profiles(loaded["profiles"])
    processed["products"] = process_products(loaded["products"])
    processed["purchases"] = process_purchases(
        loaded["purchases"], processed["profiles"], processed["products"]
    )
    processed["game_matches"] = process_matches(loaded["game_matches"], processed["profiles"])
    processed["progress"] = loaded["progress"].copy()

    records = []
    generated_at = datetime.now(timezone.utc).isoformat()
    for table_name in EXPECTED_FILES:
        if not processed[table_name].empty:
            processed[table_name].to_csv(PROCESSED_DIR / f"{table_name}.csv", index=False)
        records.append(base_quality(table_name, loaded[table_name], processed[table_name], source_info[table_name]))

    quality_frame = pd.DataFrame(records)
    quality_frame.to_csv(PROCESSED_DIR / "quality_report.csv", index=False)
    write_quality_report(records, generated_at)
    return quality_frame


if __name__ == "__main__":
    result = run_etl()
    print(result.to_string(index=False))
    print(f"Reporte: {PROCESSED_DIR / 'quality_report.md'}")
