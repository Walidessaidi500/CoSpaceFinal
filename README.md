# 🚀 CoSpace

**CoSpace** es una plataforma web para la gestión de espacios de trabajo colaborativos. Permite a los usuarios reservar salas, organizar equipos y administrar recursos de forma sencilla y eficiente.

El proyecto está desarrollado utilizando una arquitectura moderna basada en **Angular**, **Laravel** y **Docker**.

---

## 🛠️ Tecnologías utilizadas

### Frontend
- Angular  
- HTML5  
- CSS3  
- TypeScript  

### Backend
- Laravel (PHP)  
- API REST  

### Base de datos
- MySQL  

### Infraestructura
- Docker  
- Docker Compose  

---

## 📦 Arquitectura

El sistema se basa en una arquitectura contenedorizada mediante Docker, separando cada parte del proyecto en servicios independientes:

- **Frontend (Angular)**  
- **Backend (Laravel API)**  
- **Base de datos (MySQL)**  

Todos los servicios están conectados y orquestados mediante **Docker Compose**.

---

## ⚙️ Instalación y ejecución

### Requisitos previos
Debes tener instalado:
- Docker  
- Docker Compose  

---

### 1️⃣ Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/cospace.git
cd cospace
```

### 2️⃣ Configurar el backend (Laravel)
```bash
cp backend/.env.example backend/.env
```

### 3️⃣ Construir y levantar los contenedores
```bash
docker-compose up --build
```

### 4️⃣ Generar la clave de Laravel
```bash
docker exec -it cospace_backend php artisan key:generate
```

### 5️⃣ Ejecutar migraciones
```bash
docker exec -it cospace_backend php artisan migrate
```

---

## 🌐 Acceso a la aplicación
Servicio
Frontend (Angular): http://localhost:4200
Backend (Laravel API): http://localhost:8000
PHPmyadmin: http://localhost:8080

---

## 📁 Estructura del proyecto
```text
cospace/
│
├── frontend/          # Aplicación Angular
├── backend/           # API Laravel
├── docker-compose.yml
└── README.md
```
---

## 👥 Equipo de desarrollo
Este proyecto ha sido desarrollado por:
	•	Víctor
	•	Rayanne
	•	Walid Essaidi Brihmat

---

## 🎯 Objetivo del proyecto
El objetivo de CoSpace es proporcionar una solución moderna para la gestión de espacios de trabajo compartidos, permitiendo a los usuarios organizar equipos, reservar salas y optimizar el uso de recursos de forma eficiente.

---
