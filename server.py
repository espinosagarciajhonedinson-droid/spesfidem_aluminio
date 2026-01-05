import http.server
import socketserver
import json
import os
from pathlib import Path

# Configuración
PORT = 8080
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
        # API: Guardar (Crear o Actualizar) Cliente
        if self.path == '/api/clients':
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                try:
                    data = json.loads(post_data.decode('utf-8'))
                    self.upsert_client(data)
                    self.send_json({"success": True, "message": "Cliente guardado correctamente."})
                except json.JSONDecodeError:
                    self.send_error(400, "JSON inválido")
            return

        super().do_POST()

    def do_DELETE(self):
        # API: Eliminar Cliente por ID
        # Ejemplo: /api/clients/1709428358231
        if self.path.startswith('/api/clients/'):
            try:
                client_id = self.path.split('/')[-1]
                self.delete_client(client_id)
                self.send_json({"success": True, "message": "Cliente eliminado."})
            except Exception as e:
                self.send_error(500, str(e))
            return
            
        self.send_error(404, "Endpoint no encontrado")

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
            clients[index] = new_client # Actualizar
        else:
            clients.append(new_client) # Insertar nuevo
            
        self.save_clients_to_disk(clients)

    def delete_client(self, client_id):
        clients = self.load_clients()
        # Filtrar el cliente que coincida con el ID
        new_list = [c for c in clients if str(c.get('id')) != str(client_id)]
        self.save_clients_to_disk(new_list)

    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        # Headers para evitar caché en API
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

print(f"--- SERVIDOR DE PERSISTENCIA SPESFIDEM ---")
print(f"Estado: ACTIVO")
print(f"Puerto: {PORT}")
print(f"Almacenamiento: {CLIENTS_FILE.absolute()}")
print(f"------------------------------------------")

# Reutilizar dirección (allow_reuse_address) para evitar errores de puerto ocupado al reiniciar rápido
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), PersistentStorageHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
