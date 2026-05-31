import os
import json
import time
import requests

SUPABASE_URL = "https://uklygrvibmiknwarzqap.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHlncnZpYm1pa253YXJ6cWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDcyODgsImV4cCI6MjA4NjM4MzI4OH0.aY-R2vzuTzUNbjy1iGmMleikxHOT8MAtL82Rpm5q6ac" 

# Armazenamento em memória da sessão logada
current_session = None

def get_session():
    global current_session
    return current_session

def set_session(session_data):
    """
    Armazena a sessão (deve conter access_token e user_id)
    """
    global current_session
    current_session = session_data

def get_auth_headers():
    session = get_session()
    if session and "access_token" in session:
        return {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {session['access_token']}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
    # Fallback para anon key
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

def sign_in_with_password(email, password):
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "email": email,
        "password": password
    }
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            session_data = {
                "access_token": data.get("access_token"),
                "refresh_token": data.get("refresh_token"),
                "user_id": data.get("user").get("id")
            }
            set_session(session_data)
            return True, data
        else:
            return False, resp.json()
    except Exception as e:
        return False, str(e)

def get_profile(user_id):
    url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=role,full_name"
    headers = get_auth_headers()
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if len(data) > 0:
                return data[0]
        return None
    except Exception:
        return None

def get_all_profiles():
    url = f"{SUPABASE_URL}/rest/v1/profiles?select=id,email,role,nome_completo"
    headers = get_auth_headers()
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            return resp.json()
        return []
    except Exception:
        return []

def admin_create_user(email, password, role, nome_completo):
    # Corrige username para email caso não tenha arroba (Supabase Auth requer email)
    if "@" not in email:
        email = f"{email}@agrogb.com"
        
    url = f"{SUPABASE_URL}/auth/v1/signup"
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "email": email,
        "password": password,
        "data": {
            "role": role,
            "nome_completo": nome_completo
        }
    }
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=10)
        if resp.status_code in (200, 201):
            return True, resp.json()
        else:
            return False, resp.json()
    except Exception as e:
        return False, str(e)

def admin_delete_user(user_id):
    # Apenas os administradores (verificados no RLS) conseguem deletar
    url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}"
    headers = get_auth_headers()
    try:
        resp = requests.delete(url, headers=headers, timeout=10)
        return resp.status_code in (200, 204)
    except Exception:
        return False
