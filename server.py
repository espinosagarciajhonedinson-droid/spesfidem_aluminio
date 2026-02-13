import http.server
import socketserver
import json
import os
from pathlib import Path

# Configuración
PORT = 3000
DATA_DIR = Path("data")
CLIENTS_FILE = DATA_DIR / "clients.json"

# Asegurar que el directorio y archivo de datos existen
DATA_DIR.mkdir(exist_ok=True)
if not CLIENTS_FILE.exists():
    with open(CLIENTS_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f)

class PersistentStorageHandler(http.server.SimpleHTTPRequestHandler):
    """
    Manejador avanzado que sirve archivos estáticos Y actúa como API REST
    para guardar datos en un archivo JSON local.
    """
    
    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        print(f"Preflight request: {self.path}")
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def end_headers(self):
        if not hasattr(self, '_headers_sent_flag'):
             # Ensure CORS headers are sent if not already (though usually sent manually)
             # But here we are calling send_cors_headers manually in handlers.
             pass
        super().end_headers()

    def do_GET(self):
        # Normalizar path eliminando query params para el ruteo
        path_only = self.path.split('?')[0]

        # API: Obtener todos los clientes
        if path_only == '/api/clients':
            self.send_json(self.load_clients())
            return
        
        # Comportamiento normal (servir HTML, CSS, JS)
        super().do_GET()

    def do_POST(self):
        # Normalizar path
        path_only = self.path.split('?')[0]
        # Log to server.log (if redirected) or stdout
        print(f"POST request: {self.path} -> {path_only}")

        # API: Guardar (Crear o Actualizar) Cliente
        if path_only == '/api/clients':
            # Handle CORS preflight if needed (OPTIONS) handled separately
            
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                try:
                    data = json.loads(post_data.decode('utf-8'))
                    print(f"Upserting data for ID: {data.get('id')}")
                    self.upsert_client(data)
                    self.send_json({"success": True, "message": "Cliente guardado correctamente."})
                except json.JSONDecodeError:
                    print("Error: Invalid JSON on POST /api/clients")
                    # Send error with CORS
                    self.send_response(400)
                    self.send_cors_headers()
                    self.end_headers()
                    self.wfile.write(b"JSON invalido")
            return

        # API: Login Administrativo
        if path_only == '/api/login':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                credentials = json.loads(post_data.decode('utf-8'))
                user = credentials.get('username')
                password = credentials.get('password')

                print(f"INFO: Login attempt - User: '{user}', Pass Length: {len(password) if password else 0}")

                # Credenciales proporcionadas por el usuario (4 Administradores con Nombre)
                users_db = {
                    '14298116': {'pass': '14298116Je*', 'name': 'Jhon Espinosa'},
                    '1106227253': {'pass': '7253pipe', 'name': 'Felipe Molina'},
                    '1005703432': {'pass': '3432sergio', 'name': 'Sergio Suarez'},
                    '1104942399': {'pass': '2399caleb', 'name': 'Caleb Perez'}
                }

                if user in users_db:
                    user_data = users_db[user]
                    expected_password = user_data['pass']
                    is_valid = (expected_password == password)
                    print(f"DEBUG: User '{user}' found. Password match: {is_valid}")
                    
                    if is_valid:
                        print(f"SUCCESS: User {user} ({user_data['name']}) logged in.")
                        self.send_json({
                            "success": True, 
                            "token": "BASIC_AUTH_SUCCESS",
                            "name": user_data['name'] 
                        })
                    else:
                        print(f"WARN: Password mismatch for user {user}. Received '{password}'")
                        self.send_response(401)
                        self.send_cors_headers()
                        self.end_headers()
                        self.wfile.write(json.dumps({
                            "success": False, 
                            "message": "Contraseña incorrecta"
                        }).encode('utf-8'))
                else:
                    print(f"WARN: User '{user}' not found.")
                    self.send_response(401)
                    self.send_cors_headers()
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "success": False, 
                        "message": "Documento no registrado"
                    }).encode('utf-8'))
            except Exception as e:
                print(f"ERROR: Login Exception: {e}")
                self.send_error(400, "Solicitud de login inválida")
            return
        
        # Si no es un endpoint de la API, podemos ignorarlo o retornar error
        # Pero SimpleHTTPRequestHandler no maneja POST por defecto, así que no hay super a quien llamar.
        self.send_error(405, "Método POST no permitido para este recurso")

    def do_DELETE(self):
        # API: Permanently Empty Trash
        if self.path.split('?')[0].rstrip('/') == '/api/clients/trash':
            try:
                self.empty_trash()
                self.send_json({"success": True, "message": "Papelera vaciada permanentemente."})
            except Exception as e:
                self.send_error(500, str(e))
            return

        # API: Soft or Hard Delete Cliente por ID
        if self.path.startswith('/api/clients/'):
            try:
                # Extract ID and check for permanent flag
                parts = self.path.split('?')
                client_id = parts[0].split('/')[-1]
                is_permanent = len(parts) > 1 and "permanent=true" in parts[1]

                if is_permanent:
                    self.hard_delete_client(client_id)
                    self.send_json({"success": True, "message": "Cliente eliminado permanentemente."})
                else:
                    self.delete_client(client_id)
                    self.send_json({"success": True, "message": "Cliente movido a la papelera."})
            except Exception as e:
                print(f"Error in DELETE /api/clients: {e}")
                self.send_error(500, str(e))
            return
            
        self.send_error(404, "Endpoint no encontrado")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Private-Network")
        self.send_header("Access-Control-Allow-Private-Network", "true")

    def send_json(self, data):
        self.send_response(200)
        self.send_cors_headers()
        self.send_header("Content-type", "application/json")
        # Headers para evitar caché en API
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    # --- Métodos Auxiliares de Base de Datos ---

    def load_clients(self):
        try:
            with open(CLIENTS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return []

    def save_clients_to_disk(self, clients):
        with open(CLIENTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(clients, f, indent=4, ensure_ascii=False)

    def upsert_client(self, new_client):
        clients = self.load_clients()
        # Buscar índice si ya existe (por ID)
        index = next((i for i, c in enumerate(clients) if str(c.get('id')) == str(new_client.get('id'))), None)
        
        if index is not None:
            print(f"Upsert: Matching client found at index {index} (ID: {new_client.get('id')})")
            # Allow updating 'deleted' status if provided, otherwise preserve old value
            if 'deleted' in new_client:
                print(f"Upsert: Updating deleted status from {clients[index].get('deleted')} to {new_client['deleted']}")
                clients[index]['deleted'] = new_client['deleted']
            elif 'deleted' in clients[index]:
                new_client['deleted'] = clients[index]['deleted']
            
            # Update other fields
            clients[index].update(new_client) 
        else:
            print(f"Upsert: New client (ID: {new_client.get('id')})")
            clients.append(new_client) # Insertar nuevo
            
        self.save_clients_to_disk(clients)

    def delete_client(self, client_id):
        clients = self.load_clients()
        # Soft Delete: Find and mark as deleted
        found = False
        for client in clients:
            if str(client.get('id')) == str(client_id):
                client['deleted'] = True
                found = True
                break
        
        if found:
            self.save_clients_to_disk(clients)
        else:
            print(f"WARN: Delete failed. Client ID {client_id} not found.")

    def empty_trash(self):
        clients = self.load_clients()
        original_count = len(clients)
        # Keep only clients that are NOT deleted
        clients = [c for c in clients if not c.get('deleted')]
        new_count = len(clients)
        print(f"Trash Emptied: {original_count - new_count} records removed permanently.")
        self.save_clients_to_disk(clients)

    def hard_delete_client(self, client_id):
        clients = self.load_clients()
        original_count = len(clients)
        # Remove the client with the matching ID
        clients = [c for c in clients if str(c.get('id')) != str(client_id)]
        new_count = len(clients)
        if original_count != new_count:
            print(f"Hard Deleted: Client {client_id} removed permanently.")
            self.save_clients_to_disk(clients)
        else:
            print(f"WARN: Hard Delete failed. Client ID {client_id} not found.")

class ThreadedTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

print(f"--- SERVIDOR DE PERSISTENCIA SPESFIDEM ---")
print(f"Estado: ACTIVO")
print(f"Puerto: {PORT}")
print(f"Almacenamiento: {CLIENTS_FILE.absolute()}")
print(f"------------------------------------------")

with ThreadedTCPServer(("", PORT), PersistentStorageHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
