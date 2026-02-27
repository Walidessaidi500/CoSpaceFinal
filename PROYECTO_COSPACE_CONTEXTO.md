# Proyecto CoSpace - Contexto Completo

## 📋 Descripción General del Proyecto

**CoSpace** es una plataforma web de reserva de espacios de coworking que conecta a usuarios (clientes) que buscan espacios de trabajo con anfitriones que ofrecen estos espacios.

### Objetivo
Crear una aplicación web completa con un sistema de diseño consistente y profesional que permita:
- A los clientes buscar, explorar y reservar espacios de coworking
- A los anfitriones publicar y gestionar sus espacios
- A los administradores gestionar toda la plataforma

---

## 🎨 Sistema de Diseño - Guía de Estilos CoSpace

### Paleta de Colores

#### Colores Principales
| Color | Código HEX | Uso |
|-------|------------|-----|
| **Azul Oscuro** | `#0d1b2a` | Headers, sidebar, textos importantes, navegación principal |
| **Naranja** | `#ff7a00` | Botones principales, acentos, CTAs, highlights |
| **Rojo** | `#d4183d` | Botones destructivos (cancelar/eliminar) |
| **Blanco** | `#ffffff` | Fondo de cards, modales, contenido principal |
| **Gris Fondo** | `#f5f5f5` | Fondo general de páginas |

#### Escala de Grises
| Color | Código HEX | Uso |
|-------|------------|-----|
| **Gris Claro** | `#f3f3f5` | Fondo de inputs, campos de formulario |
| **Gris Texto** | `#4a5565` | Textos secundarios, descripciones |
| **Gris Placeholder** | `#717182` | Placeholders en inputs |

#### Colores con Transparencia
| Color | Código | Uso |
|-------|--------|-----|
| **Naranja Claro** | `rgba(255,122,0,0.1)` | Fondo de iconos destacados |
| **Border Sutil** | `rgba(0,0,0,0.1)` | Bordes sutiles de cards y divisores |
| **Blanco Semi** | `rgba(255,255,255,0.1)` | Fondos en sidebar oscuro |
| **Blanco Texto** | `rgba(255,255,255,0.7)` | Labels en sidebar |

---

### Tipografía

**Fuente:** Poppins (importada desde Google Fonts)

#### Escala Tipográfica
| Elemento | Tamaño | Peso | Uso | Clase CSS |
|----------|--------|------|-----|-----------|
| **H1 - Título Grande** | 40px | SemiBold | Títulos principales de página | `text-[40px] font-['Poppins:SemiBold',sans-serif]` |
| **H2 - Título Mediano** | 32px | SemiBold | Subtítulos de secciones | `text-[32px] font-['Poppins:SemiBold',sans-serif]` |
| **H3 - Título Pequeño** | 24px | SemiBold | Títulos de cards, subsecciones | `text-[24px] font-['Poppins:SemiBold',sans-serif]` |
| **H4 - Subtítulo** | 20px | SemiBold | Nombres de espacios, elementos destacados | `text-[20px] font-['Poppins:SemiBold',sans-serif]` |
| **Texto Normal** | 16px | Regular | Contenido general, descripciones | `text-[16px]` |
| **Texto Pequeño** | 14px | Regular/Medium | Información secundaria, labels | `text-[14px]` |
| **Labels Sidebar** | 12px | Medium | Etiquetas de navegación | `text-[12px] font-['Poppins:Medium',sans-serif]` |

#### Jerarquía de Color en Texto
- **Azul Oscuro** (`#0d1b2a`): Títulos y texto importante
- **Gris Texto** (`#4a5565`): Texto secundario y detalles
- **Blanco**: Texto en sidebar y botones principales

---

### Botones

#### Variantes de Botones

##### 1. Botón Naranja (Principal / CTA)
```css
background: #ff7a00
color: white
border-radius: rounded-full
padding: px-4 py-2 o px-6 py-3
font-size: 14px
font-weight: Medium
```
**Uso:** Acciones principales como "Reservar Ya", "Registrar", "Guardar"

##### 2. Botón Rojo (Destructivo)
```css
background: #d4183d
color: white
border-radius: rounded-full
padding: px-4 py-2 o px-6 py-3
font-size: 14px
font-weight: Medium
```
**Uso:** Acciones destructivas como "Cancelar", "Eliminar", "Borrar"

##### 3. Botón Blanco con Borde (Secundario)
```css
background: white
border: 1px solid rgba(0,0,0,0.1) o 1px solid #0d1b2a
color: #0d1b2a
border-radius: rounded-full
padding: px-4 py-2 o px-6 py-3
font-size: 14px
font-weight: Medium
```
**Uso:** Acciones secundarias como "Ver Detalles", "Editar", "Contactar Anfitrión"

##### 4. Botón Azul Oscuro (Secundario Alternativo)
```css
background: #0d1b2a
color: white
border-radius: rounded-full
padding: px-4 py-2 o px-6 py-3
font-size: 14px
font-weight: Medium
```
**Uso:** Acciones importantes pero no primarias

---

### Inputs y Formularios

#### Input Estándar
```css
background: #f3f3f5
border-radius: rounded-2xl (16px)
padding: px-3 py-2 o px-4 py-3
border: ninguno (solo fondo)
placeholder-color: #717182
text-color: #0d1b2a
font-size: 14px o 16px
```

#### Estados de Input
- **Normal:** Fondo gris claro
- **Focus:** Mantener mismo estilo (puede añadir outline naranja sutil)
- **Error:** Borde rojo o mensaje de error debajo
- **Disabled:** Opacidad reducida

---

### Cards y Tarjetas

#### Card Básica
```css
background: white
border-radius: rounded-2xl (16px)
border: 1px solid rgba(0,0,0,0.1)
box-shadow: shadow-lg
padding: p-6
```

#### Card con Imagen (Espacios)
- Imagen superior con `rounded-t-2xl`
- Contenido interior con `p-4` o `p-6`
- Footer con botones al fondo
- Información organizada: nombre, ubicación, rating, precio

#### Card Flotante (Reservas/Precios)
```css
background: white
border-radius: rounded-2xl
box-shadow: shadow-xl (más pronunciada)
position: sticky o fixed (en desktop)
padding: p-6
```

---

### Tabs/Pestañas

#### Contenedor de Tabs
```css
background: white
border-radius: rounded-full
border: 1px solid rgba(0,0,0,0.1)
padding: p-1
display: inline-flex
gap: gap-1
```

#### Tab Individual
- **Activa:** Fondo blanco, sombra sutil (`shadow-sm`), texto `#0d1b2a`
- **Inactiva:** Sin fondo, texto `#0d1b2a`
- **Padding:** `px-6 py-2` o `px-8 py-2`
- **Border radius:** `rounded-full`
- **Font:** 14px Medium

---

### Sidebar de Navegación

#### Contenedor Principal
```css
background: #0d1b2a
width: 256px (w-64)
border-radius: rounded-r-2xl (solo derecha)
padding: p-6
color: white
```

#### Items de Navegación
- **Activo:** `background: #1a2942` (azul más claro)
- **Inactivo:** `background: transparent`
- **Padding:** `px-3 py-2`
- **Border radius:** `rounded-lg`
- **Gap:** `gap-3`
- **Iconos:** Blancos, 16px
- **Texto:** 14px, color blanco

#### Labels/Categorías
```css
font-size: 12px
font-weight: Medium
color: rgba(255,255,255,0.7)
padding: px-2
margin-bottom: mb-4
```

#### Perfil de Usuario (Footer)
- Border top: `border-t` con `borderColor: rgba(255,255,255,0.1)`
- Avatar circular naranja con inicial
- Nombre y email apilados

---

### Iconos con Fondo

#### Iconos Destacados (Features)
```css
container-size: 40px × 40px o 48px × 48px
background: rgba(255,122,0,0.1)
icon-color: #ff7a00
icon-size: 20px o 24px
border-radius: rounded-full
display: flex
align-items: center
justify-content: center
```
**Uso:** Características de espacios, stats del dashboard

---

### Sistema de Rating

#### Estrella + Puntuación
```css
⭐ icono (color naranja #ff7a00)
Texto: 16px Regular
Color texto: #4a5565
Formato: "4.8 (124 reseñas)"
Gap entre elementos: gap-1 o gap-2
```

---

### Logo CoSpace

#### Composición
- **Círculo:** 40px × 40px, fondo `#0d1b2a`, `rounded-xl`
- **Letra "C":** Blanca, centrada, 16px SemiBold
- **Texto "CoSpace":** 20px o 24px SemiBold, color según contexto
- **Layout:** Horizontal con `gap-2`

---

### Galería de Imágenes

#### Layout de Galería
```css
border-radius: rounded-2xl (16px)
gap: gap-4
layout: grid o flexbox
```
- Imagen principal más grande
- Thumbnails secundarias más pequeñas
- Hover: Escala sutil o overlay

---

### Información con Iconos

#### Patrón de Info
```css
icon: 16px × 16px, color #4a5565
text: 16px Regular, color #4a5565
gap: gap-1 o gap-2
display: flex items-center
```
**Ejemplos:** 📍 Ubicación, 📅 Fecha, 🕐 Hora

---

### Sistema de Espaciado

#### Espaciado Estándar
| Uso | Valor Tailwind | Píxeles |
|-----|----------------|---------|
| Entre secciones grandes | `gap-8` | 32px |
| Entre cards | `gap-6` o `gap-4` | 24px o 16px |
| Entre elementos pequeños | `gap-2` o `gap-4` | 8px o 16px |
| Padding contenedores | `p-6` o `p-8` | 24px o 32px |
| Padding sidebar items | `px-2` o `px-3` | 8px o 12px |
| Padding cards | `p-6` | 24px |

---

## 🏗️ Estructura del Proyecto

### Pantallas Principales

#### 1. **Página de Inicio (Landing)**
- Hero section con buscador principal
- Grid de espacios destacados
- Features/Beneficios de la plataforma
- Testimonios
- Footer con links

#### 2. **Login**
- Formulario centrado
- Input de email y contraseña
- Botón naranja de login
- Link a registro

#### 3. **Registro de Anfitrión**
- Formulario multi-paso
- Datos personales
- Datos del espacio
- Fotos y detalles
- Confirmación

#### 4. **Panel de Cliente**
- Sidebar con navegación
- Secciones:
  - Mis Reservas
  - Explorar Espacios
  - Favoritos
  - Perfil
  - Configuración

#### 5. **Panel de Anfitrión**
- Sidebar con navegación
- Secciones:
  - Dashboard (estadísticas)
  - Mis Espacios
  - Reservas Recibidas
  - Calendario
  - Ingresos
  - Perfil

#### 6. **Panel de Administrador**
- Sidebar con navegación
- Secciones:
  - Dashboard (métricas generales)
  - Gestión de Usuarios
  - Gestión de Espacios
  - Gestión de Reservas
  - Gestión de Pagos
  - Reportes
  - Configuración

#### 7. **Pantalla de Coworking (Detalle)**
- Galería de imágenes
- Información del espacio
- Características y amenidades
- Calendario de disponibilidad
- Card de reserva flotante
- Reseñas
- Ubicación (mapa)

---

## 📦 Estado Actual del Proyecto

### Archivos Existentes

#### `/App.tsx` - Panel de Administrador
Panel de administrador completo con 7 secciones funcionales:
- **Dashboard:** Cards de estadísticas, últimas reservas, espacios populares
- **Usuarios:** Tabla completa con tabs, búsqueda, acciones
- **Espacios:** Grid de cards de espacios con estados y acciones
- **Reservas:** Lista de reservas con tabs por estado
- **Pagos:** Estadísticas financieras y tabla de transacciones
- **Reportes:** Gráficos y métricas de problemas reportados
- **Configuración:** Formularios de ajustes de la plataforma

**Características implementadas:**
- Sidebar oscuro con navegación activa
- Todas las variantes de botones
- Sistema de tabs funcional
- Cards con diferentes layouts
- Tablas responsivas
- Badges de estado con colores
- Iconos con fondo naranja
- Estadísticas con badges de crecimiento

#### `/Guidelines.md` - Guía de Estilos
Documento de referencia completo con todos los estilos del sistema de diseño.

#### `/imports/GuiaDeEstilosCoSpace.tsx` - Guía Visual
Componente de Figma que muestra visualmente todos los elementos de diseño:
- Paleta de colores con códigos HEX
- Ejemplos de tipografía en todos los tamaños
- Todas las variantes de botones
- Inputs y formularios
- Cards y tarjetas
- Tabs/pestañas
- Sidebar
- Iconos con fondo
- Sistema de rating
- Espaciado

---

## ✅ Reglas Importantes de Diseño

### Principios de Diseño CoSpace

1. ✅ **Bordes redondeados siempre** - Nunca usar esquinas rectas
2. ✅ **Jerarquía de botones clara:**
   - Naranja para acciones principales
   - Rojo para acciones destructivas
   - Blanco con borde para acciones secundarias
3. ✅ **Inputs con fondo gris claro** - Nunca inputs con solo borde
4. ✅ **Cards siempre con sombra suave** - `shadow-lg` o `shadow-xl`
5. ✅ **Sidebar oscuro** para navegación de paneles (cliente, anfitrión, admin)
6. ✅ **Iconos con fondo naranja claro** para features y características destacadas
7. ✅ **Espaciado generoso** entre elementos - No apretar contenido
8. ✅ **Botones "Ver Detalles" y "Editar"** siempre con borde blanco
9. ✅ **Consistencia en border-radius:**
   - Botones: `rounded-full`
   - Cards: `rounded-2xl` (16px)
   - Inputs: `rounded-2xl` (16px)
   - Logo: `rounded-xl` (12px)

### Sistema de Estados

#### Estados de Reserva
- **Activa:** Verde `#22c55e` con fondo `rgba(34,197,94,0.1)`
- **Completada:** Azul oscuro `#0d1b2a` con fondo `rgba(13,27,42,0.1)`
- **Cancelada:** Rojo `#d4183d` con fondo `rgba(212,24,61,0.1)`
- **Pendiente:** Naranja `#ff7a00` con fondo `rgba(255,122,0,0.1)`

#### Estados de Usuario
- **Activo:** Verde con badge
- **Inactivo:** Gris con badge

#### Tipos de Usuario
- **Cliente:** Badge gris/azul
- **Anfitrión:** Badge naranja

---

## 🎯 Patrones de Diseño Comunes

### Pattern: Card de Espacio
```
[Imagen - rounded-t-2xl]
[Contenido p-6]
  - Título (20px SemiBold) + Badge de estado
  - Ubicación con icono 📍
  - Rating con estrella ⭐
  - Precio (24px SemiBold)
  - Botones (Editar + Eliminar/Ver)
```

### Pattern: Stat Card (Dashboard)
```
[Card blanca con shadow-lg]
  - Icono con fondo naranja claro
  - Label pequeño (14px, color gris)
  - Número grande (32px SemiBold)
  - Badge de crecimiento (+12%)
```

### Pattern: Fila de Tabla
```
- Avatar/Icono
- Información principal (14px Medium)
- Información secundaria (14px Regular, gris)
- Badges de estado
- Botones de acción
```

### Pattern: Tab Navigation
```
[Contenedor blanco rounded-full con border]
  [Tab activa: bg-white shadow-sm]
  [Tab inactiva: bg-transparent]
  [Tab inactiva: bg-transparent]
```

---

## 🚀 Próximos Pasos Sugeridos

### Pantallas Faltantes (por orden de prioridad)
1. **Landing Page** - Página de inicio pública
2. **Login/Registro** - Autenticación de usuarios
3. **Panel de Cliente** - Vista para usuarios finales
4. **Panel de Anfitrión** - Vista para propietarios de espacios
5. **Detalle de Coworking** - Página individual de cada espacio
6. **Búsqueda y Filtros** - Sistema de búsqueda avanzada
7. **Checkout/Pago** - Proceso de reserva y pago

### Funcionalidades a Implementar
- Sistema de favoritos
- Sistema de reseñas y ratings
- Calendario interactivo de disponibilidad
- Integración de mapas (ubicación de espacios)
- Chat entre cliente y anfitrión
- Sistema de notificaciones
- Gestión de fotos (upload de imágenes)

---

## 📝 Notas Técnicas

### Stack Tecnológico
- **Framework:** React
- **Styling:** Tailwind CSS v4
- **Fuentes:** Google Fonts (Poppins)
- **Componentes:** Componentes customizados siguiendo la guía de estilos

### Estructura de Componentes Sugerida
```
/components
  /common
    - Button.tsx (variantes: primary, destructive, secondary)
    - Card.tsx
    - Input.tsx
    - Badge.tsx
    - Sidebar.tsx
  /spaces
    - SpaceCard.tsx
    - SpaceGallery.tsx
    - SpaceInfo.tsx
  /bookings
    - BookingCard.tsx
    - BookingTable.tsx
  /dashboard
    - StatCard.tsx
    - RecentActivity.tsx
```

### Convenciones de Código
- Usar estilos inline con `style={{}}` para colores específicos de la marca
- Usar clases de Tailwind para layout y espaciado
- Fuentes con sintaxis `font-['Poppins:SemiBold',sans-serif]`
- Colores principales siempre como variables reutilizables

---

## 🎨 Paleta de Colores - Referencia Rápida

```javascript
const colors = {
  primary: {
    blue: '#0d1b2a',
    orange: '#ff7a00',
    red: '#d4183d',
    white: '#ffffff',
  },
  neutral: {
    background: '#f5f5f5',
    inputBg: '#f3f3f5',
    textSecondary: '#4a5565',
    placeholder: '#717182',
  },
  opacity: {
    orangeLight: 'rgba(255,122,0,0.1)',
    border: 'rgba(0,0,0,0.1)',
    whiteOverlay: 'rgba(255,255,255,0.1)',
    whiteText: 'rgba(255,255,255,0.7)',
  },
  status: {
    success: '#22c55e',
    successBg: 'rgba(34,197,94,0.1)',
  }
};
```

---

## 📊 Ejemplo de Datos Mock

### Espacio de Coworking
```javascript
{
  id: "1",
  name: "Centro Creativo Madrid",
  location: "Madrid, ES",
  price: "14€/h",
  rating: 4.8,
  reviews: 124,
  status: "Activo",
  image: "...",
  amenities: ["WiFi", "Café", "Impresora", "Sala de reuniones"],
  description: "Espacio moderno y luminoso...",
  host: {
    name: "María García",
    avatar: "...",
  }
}
```

### Reserva
```javascript
{
  id: "#12345",
  user: "Juan Pérez",
  space: "Centro Creativo Madrid",
  date: "Nov 15, 2025",
  time: "09:00 - 12:00",
  price: "75€",
  status: "Activa"
}
```

---

## 🔍 Palabras Clave del Proyecto
- Coworking
- Reserva de espacios
- Anfitrión/Host
- Cliente/Usuario
- Panel de administración
- Dashboard
- Sistema de diseño
- Poppins
- Azul oscuro
- Naranja
- Cards redondeadas
- Sidebar oscuro

---

## ✨ Filosofía de Diseño

CoSpace busca un diseño:
- **Moderno y limpio** con mucho espacio en blanco
- **Acogedor y profesional** equilibrando lo corporativo con lo creativo
- **Intuitivo y fácil de usar** con jerarquía visual clara
- **Consistente** en todos los elementos y pantallas
- **Responsivo** adaptándose a mobile, tablet y desktop

---

**Última actualización:** 15 de enero de 2026  
**Versión del documento:** 1.0  
**Estado del proyecto:** En desarrollo

---

¡Gracias por ayudar a construir CoSpace! 🚀
