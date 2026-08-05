from app.adapters.base.base_adapter import VendorAdapter

_KNOWN_VENDORS = {
    "veracode",
    "github",
    "dependabot",
    "dynatrace",
    "datadog",
    "cloudwatch",
    "newrelic",
}


def get_adapter(vendor: str) -> VendorAdapter:
    vendor_key = vendor.lower()
    if vendor_key not in _KNOWN_VENDORS:
        raise ValueError(f"Unknown vendor '{vendor}'")
    # Concrete adapters are implemented per-vendor under app/adapters/<vendor>/
    # as each integration is built out.
    raise NotImplementedError(f"No adapter implementation registered yet for vendor '{vendor}'")
