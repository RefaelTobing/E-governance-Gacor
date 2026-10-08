import math
from typing import Any
from PIL import Image

GPSINFO_TAG = 34853


def _to_float(val: Any) -> float | None:
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (ZeroDivisionError, ValueError, TypeError, AttributeError):
        return None


def _dms_to_decimal(dms: Any, ref: Any, allowed_refs: tuple[str, ...]) -> float | None:
    if not isinstance(ref, str):
        return None
    ref_clean = ref.strip().upper()
    if ref_clean not in allowed_refs:
        return None

    if not hasattr(dms, "__getitem__") or len(dms) < 3:
        return None

    d = _to_float(dms[0])
    m = _to_float(dms[1])
    s = _to_float(dms[2])

    if d is None or m is None or s is None:
        return None

    dec = d + (m / 60.0) + (s / 3600.0)
    if math.isnan(dec) or math.isinf(dec):
        return None

    result = -dec if ref_clean in ("S", "W") else dec

    if "N" in allowed_refs and not (-90.0 <= result <= 90.0):
        return None
    if "E" in allowed_refs and not (-180.0 <= result <= 180.0):
        return None

    return result


def extract_gps_from_file(absolute_path: str) -> tuple[float | None, float | None]:
    try:
        with Image.open(absolute_path) as img:
            exif_data = img._getexif()
            if not exif_data:
                return None, None

            gps_info = exif_data.get(GPSINFO_TAG)
            if not gps_info or not isinstance(gps_info, dict):
                return None, None

            lat_dms = gps_info.get(2)
            lat_ref = gps_info.get(1)
            lon_dms = gps_info.get(4)
            lon_ref = gps_info.get(3)

            if not (lat_dms and lon_dms and lat_ref and lon_ref):
                return None, None

            lat = _dms_to_decimal(lat_dms, lat_ref, ("N", "S"))
            lon = _dms_to_decimal(lon_dms, lon_ref, ("E", "W"))

            if lat is None or lon is None:
                return None, None

            return lat, lon
    except Exception:
        return None, None
