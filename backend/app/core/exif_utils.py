from PIL import Image, UnidentifiedImageError

GPSINFO_TAG = 34853


def _dms_to_decimal(dms: tuple, ref: str) -> float:
    d, m, s = float(dms[0]), float(dms[1]), float(dms[2])
    dec = d + m/60 + s/3600
    return -dec if ref in ('S', 'W') else dec


def extract_gps_from_file(absolute_path: str) -> tuple[float | None, float | None]:
    try:
        img = Image.open(absolute_path)
        exif_data = img._getexif()
        if not exif_data:
            return None, None
        gps_info = exif_data.get(GPSINFO_TAG)
        if not gps_info:
            return None, None
        lat_dms = gps_info.get(2)
        lat_ref = gps_info.get(1)
        lon_dms = gps_info.get(4)
        lon_ref = gps_info.get(3)
        if not (lat_dms and lon_dms and lat_ref and lon_ref):
            return None, None
        lat = _dms_to_decimal(lat_dms, lat_ref)
        lon = _dms_to_decimal(lon_dms, lon_ref)
        return lat, lon
    except (UnidentifiedImageError, OSError, AttributeError, TypeError, KeyError):
        return None, None
