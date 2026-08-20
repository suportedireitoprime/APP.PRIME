import os
import sys
import time
import base64
import requests
import jwt

def get_token():
    key_id = os.environ['APPLE_API_KEY_ID']
    issuer_id = os.environ['APPLE_API_ISSUER_ID']
    key_path = os.environ['APPLE_API_KEY_PATH']
    
    with open(key_path, 'r') as f:
        private_key = f.read()

    headers = {
        "alg": "ES256",
        "kid": key_id,
        "typ": "JWT"
    }

    payload = {
        "iss": issuer_id,
        "iat": int(time.time()),
        "exp": int(time.time()) + 1200,
        "aud": "appstoreconnect-v1"
    }

    return jwt.encode(payload, private_key, algorithm="ES256", headers=headers)

def main():
    if len(sys.argv) < 2:
        print("Usage: asc-create-profile.py <output_path>")
        sys.exit(1)
        
    out_path = sys.argv[1]
    bundle_id = os.environ['APPLE_BUNDLE_ID']
    
    print(f"Fetching profile for {bundle_id} via App Store Connect API...")
    
    token = get_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # 1. Fetch Bundle ID Resource ID
    url_bundle = f"https://api.appstoreconnect.apple.com/v1/bundleIds?filter[identifier]={bundle_id}"
    resp = requests.get(url_bundle, headers=headers)
    resp.raise_for_status()
    data = resp.json()
    
    if not data.get("data"):
        print(f"Error: Bundle ID {bundle_id} not found in App Store Connect.", file=sys.stderr)
        sys.exit(1)
        
    bundle_resource_id = data["data"][0]["id"]
    print(f"Found Bundle Resource ID: {bundle_resource_id}")
    
    # 2. Fetch Profiles for this Bundle ID
    url_profiles = f"https://api.appstoreconnect.apple.com/v1/profiles?filter[profileType]=IOS_APP_STORE&filter[bundleId]={bundle_resource_id}&sort=-id"
    resp = requests.get(url_profiles, headers=headers)
    resp.raise_for_status()
    data = resp.json()
    
    if not data.get("data"):
        print(f"Error: No IOS_APP_STORE profile found for {bundle_id}.", file=sys.stderr)
        sys.exit(1)
        
    # Get the first profile (latest)
    profile_data = data["data"][0]
    profile_id = profile_data["id"]
    profile_name = profile_data["attributes"]["name"]
    profile_content_b64 = profile_data["attributes"]["profileContent"]
    
    print(f"Found Profile: {profile_name} ({profile_id})")
    
    with open(out_path, "wb") as f:
        f.write(base64.b64decode(profile_content_b64))
        
    print(f"Profile successfully saved to {out_path}")

if __name__ == "__main__":
    main()
