#!/usr/bin/env python3
"""Cria (ou recria) um provisioning profile App Store para o bundle atual via App Store Connect API.

Uso: asc-create-profile.py <caminho-de-saida.mobileprovision>
Requer env: APPLE_API_KEY_ID, APPLE_API_ISSUER_ID, APPLE_API_KEY_PATH, APPLE_BUNDLE_ID
"""
import base64
import os
import sys
import time

import jwt
import requests

API = "https://api.appstoreconnect.apple.com/v1"

key_id = os.environ["APPLE_API_KEY_ID"]
issuer_id = os.environ["APPLE_API_ISSUER_ID"]
key_path = os.environ["APPLE_API_KEY_PATH"]
bundle_id = os.environ["APPLE_BUNDLE_ID"]
out_path = sys.argv[1]

with open(key_path, "r") as f:
    private_key = f.read()

token = jwt.encode(
    {"iss": issuer_id, "iat": int(time.time()), "exp": int(time.time()) + 20 * 60, "aud": "appstoreconnect-v1"},
    private_key,
    algorithm="ES256",
    headers={"kid": key_id, "typ": "JWT"},
)
H = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def get(path, **params):
    r = requests.get(f"{API}/{path}", headers=H, params=params, timeout=60)
    if not r.ok:
        print(f"::error::GET {path} falhou [{r.status_code}]: {r.text}")
        sys.exit(1)
    return r.json()


# 1. bundle id registrado no portal
bundles = get("bundleIds", **{"filter[identifier]": bundle_id, "limit": 200})["data"]
bundles = [b for b in bundles if b["attributes"]["identifier"] == bundle_id]
if not bundles:
    print(f"::error::Bundle ID {bundle_id} não está registrado no Apple Developer Portal (Identifiers).")
    sys.exit(1)
bundle_ref = bundles[0]["id"]

# 2. certificado de distribuição
certs = [
    c
    for c in get("certificates", **{"limit": 200})["data"]
    if c["attributes"].get("certificateType") in ("DISTRIBUTION", "IOS_DISTRIBUTION")
]
if not certs:
    print("::error::Nenhum certificado de distribuição na conta Apple Developer.")
    sys.exit(1)
cert_ids = [c["id"] for c in certs]
print(f"Certificados de distribuição encontrados: {len(cert_ids)}")

profile_name = f"Prime App Store {bundle_id}"

# 3. remove perfis antigos com o mesmo nome (ASC não permite nomes duplicados)
for p in get("profiles", **{"limit": 200})["data"]:
    if p["attributes"]["name"] == profile_name:
        requests.delete(f"{API}/profiles/{p['id']}", headers=H, timeout=60)
        print(f"Perfil antigo removido: {profile_name}")

payload = {
    "data": {
        "type": "profiles",
        "attributes": {"name": profile_name, "profileType": "IOS_APP_STORE"},
        "relationships": {
            "bundleId": {"data": {"type": "bundleIds", "id": bundle_ref}},
            "certificates": {"data": [{"type": "certificates", "id": cid} for cid in cert_ids]},
        },
    }
}
r = requests.post(f"{API}/profiles", headers=H, json=payload, timeout=60)
if not r.ok:
    print(f"::error::Falha ao criar provisioning profile [{r.status_code}]: {r.text}")
    sys.exit(1)

content = r.json()["data"]["attributes"]["profileContent"]
with open(out_path, "wb") as f:
    f.write(base64.b64decode(content))
print(f"Perfil App Store criado para {bundle_id}: {profile_name}")
