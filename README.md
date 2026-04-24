# 🍖 Comidas Rápidas NE&AN - App de Pedidos

Aplicación web progresiva (PWA) para recibir pedidos de comidas rápidas vía WhatsApp.

## ✨ Características

- 📱 **Diseño responsive** - Funciona perfecto en celulares y tablets
- 🛒 **Carrito de compras** - Agrega, quita y modifica cantidades
- 📤 **Envío por WhatsApp** - El pedido se envía automáticamente formateado
- 💳 **Métodos de pago** - Efectivo, Nequi, Daviplata, Bre-B
- 🏍️ **Domicilio gratis** - Configurado para tu negocio
- 📲 **Instalable** - Se puede "instalar" en el teléfono como una app nativa
- 🔌 **Funciona offline** - Cachea recursos para uso sin internet

## 📋 Menú Configurado

| Producto | Precio |
|----------|--------|
| Chuzos | $5.000 |
| Chorizos Asados | $9.000 |
| Choriespecial | $18.000 |
| Choricarne | $15.000 |
| Choripollo | $15.000 |

## 🚀 Cómo Publicar (Gratis)

### Opción 1: Netlify (Recomendada)

1. Ve a [netlify.com](https://netlify.com) y crea una cuenta gratis
2. Arrastra la carpeta `chorichuzos-app` a la zona de deploy
3. ¡Listo! Te dará un link tipo `https://nean-pedidos.netlify.app`

### Opción 2: Vercel

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta gratis
2. Sube esta carpeta como un nuevo proyecto
3. ¡Listo! Te dará un link tipo `https://nean-pedidos.vercel.app`

### Opción 3: GitHub Pages

1. Sube esta carpeta a un repositorio de GitHub
2. Ve a Settings > Pages
3. Selecciona la rama principal
4. Tu app estará en `https://tusuario.github.io/chorichuzos-app`

### Opción 4: Firebase Hosting

1. Ve a [firebase.google.com](https://firebase.google.com)
2. Crea un proyecto
3. Instala Firebase CLI: `npm install -g firebase-tools`
4. Corre: `firebase login`, `firebase init`, `firebase deploy`

## 📲 Cómo compartir a tus clientes

1. **Link directo:** Comparte el link de tu app por WhatsApp, Instagram, Facebook
2. **QR Code:** Genera un QR del link para poner en tu local físico
3. **APK (Android):** Usa [PWA Builder](https://www.pwabuilder.com/) para convertir la PWA en APK

## 🔄 Para actualizar el menú o precios

Edita el archivo `js/app.js` y modifica la constante `PRODUCTS`:

```javascript
const PRODUCTS = [
    {
        id: 1,
        name: "Nuevo Producto",
        price: 12000,
        description: "Descripción...",
        icon: "fa-utensils",
        badge: "Nuevo"
    },
    // ...
];
```

## 📞 Datos del Negocio

- **Nombre:** Comidas Rápidas NE&AN
- **WhatsApp:** 317 779 8409
- **Ubicación:** Santander de Quilichao, Cauca
- **Domicilio:** Gratis

## 🎨 Personalización

- Cambia colores en `css/style.css` (variables CSS)
- Agrega fotos reales reemplazando los iconos en las tarjetas
- Modifica el horario en `index.html`

## 📝 Licencia

Proyecto privado para Comidas Rápidas NE&AN.
