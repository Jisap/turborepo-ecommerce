# Documentación del Flujo de Pago con Stripe

Este documento describe el proceso de pago de la aplicación, desde que el usuario está en su carrito de compras hasta que finaliza el pago utilizando Stripe.

## Resumen del Flujo

El proceso de checkout está dividido en 3 pasos principales, controlados por un parámetro `step` en la URL (`/cart?step=N`):

1.  **Revisión del Carrito**: El usuario visualiza los productos a comprar.
2.  **Información de Envío**: El usuario introduce su dirección y datos de contacto.
3.  **Pago**: El usuario introduce sus datos de pago a través de un formulario seguro de Stripe y confirma la compra.

## Tecnologías Involucradas

-   **Frontend**: Next.js (React)
-   **Gestión de Estado**: Zustand (`useCartStore`)
-   **Formularios**: React Hook Form con Zod para validación.
-   **Autenticación**: Clerk
-   **Pasarela de Pago**: Stripe (con `@stripe/react-stripe-js`)
-   **Backend**: Un microservicio de pagos (`payment-service`) que se comunica con la API de Stripe.

## Flujo Detallado

### Paso 1: Carrito de Compras (`/cart?step=1`)

-   **Componente Principal**: `d:/React-Utilidades/turborepo-ecom/apps/client/src/app/cart/page.tsx`
-   **Lógica**:
    -   Se lee el parámetro `step` de la URL. Si no existe, se asume que es `1`.
    -   Se obtienen los artículos del carrito desde el store de Zustand (`useCartStore`).
    -   Se renderiza una lista de los productos en el carrito, mostrando detalles como imagen, nombre, cantidad, talla, color y precio.
    -   Se muestra un resumen del pedido (subtotal, descuentos, total).
    -   Un botón "Continue" permite al usuario avanzar. Al hacer clic, se navega a `/cart?step=2`.

### Paso 2: Dirección de Envío (`/cart?step=2`)

-   **Componentes Involucrados**:
    -   `d:/React-Utilidades/turborepo-ecom/apps/client/src/app/cart/page.tsx`
    -   `d:/React-Utilidades/turborepo-ecom/apps/client/src/components/ShippingForm.tsx`
-   **Lógica**:
    1.  La página del carrito detecta `step=2` y renderiza el componente `<ShippingForm />`.
    2.  `<ShippingForm />` muestra un formulario para que el usuario ingrese su nombre, email, teléfono y dirección.
    3.  La validación de los campos se realiza en tiempo real gracias a `react-hook-form` y el esquema definido con `zod` en `@repo/types`.
    4.  Al enviar el formulario con éxito, la función `handleShippingForm` en `ShippingForm.tsx` se ejecuta.
    5.  Esta función eleva los datos del formulario al componente padre (`CartPage`) a través de la prop `setShippingForm`.
    6.  Inmediatamente después, redirige al usuario al siguiente y último paso: `/cart?step=3`.

### Paso 3: Método de Pago (`/cart?step=3`)

-   **Componentes Involucrados**:
    -   `d:/React-Utilidades/turborepo-ecom/apps/client/src/app/cart/page.tsx`
    -   `d:/React-Utilidades/turborepo-ecom/apps/client/src/components/StripePaymentForm.tsx`
    -   `d:/React-Utilidades/turborepo-ecom/apps/client/src/components/CheckoutForm.tsx`
-   **Lógica**:
    1.  **Creación de la Sesión de Pago**:
        -   `CartPage` detecta `step=3` y renderiza `<StripePaymentForm />`, pasándole los datos del formulario de envío.
        -   `StripePaymentForm` obtiene un token de autenticación del usuario a través de Clerk (`useAuth().getToken()`).
        -   Se invoca la función `fetchClientSecret`, que realiza una petición `POST` al endpoint `/sessions/create-checkout-session` del `payment-service`.
        -   **En el `payment-service` (backend)**:
            -   Se valida el token de Clerk.
            -   Se utiliza la información del carrito para crear una sesión de pago (Payment Intent o Checkout Session) con la API de Stripe.
            -   La API de Stripe devuelve un `client_secret`.
            -   El `payment-service` devuelve este `client_secret` al frontend.
    2.  **Renderizado del Formulario de Stripe**:
        -   `StripePaymentForm` envuelve a `CheckoutForm` en el provider `<CheckoutProvider />` de Stripe.
        -   A este provider se le pasa la función `fetchClientSecret` en sus opciones. El SDK de Stripe la ejecutará para obtener el secreto y poder inicializar el formulario de pago.
        -   `CheckoutForm` renderiza el componente `<PaymentElement />`. Este componente es una UI pre-construida y segura de Stripe que muestra los campos para la tarjeta y otros métodos de pago.
    3.  **Confirmación del Pago**:
        -   Cuando el usuario pulsa el botón "Pay" en `CheckoutForm`, se ejecuta la función `handleClick`.
        -   Se usa el hook `useCheckout` para obtener el objeto `checkout` de Stripe.
        -   Se actualiza la sesión de Stripe con el email y la dirección de envío del cliente: `checkout.updateEmail()` y `checkout.updateShippingAddress()`.
        -   Se llama a `checkout.confirm()`. Esta es la acción final. El SDK de Stripe se encarga de:
            -   Recolectar de forma segura los datos del `<PaymentElement />`.
            -   Enviar los datos a Stripe para confirmar el pago.
            -   Gestionar flujos de autenticación adicionales como 3D Secure.
            -   Redirigir al usuario a la página de éxito o error configurada en el backend al momento de crear la sesión.


### Resumen

Este flujo garantiza que los datos sensibles de pago nunca tocan tu servidor de frontend ni tu backend, cumpliendo con los estándares de seguridad PCI.

Paso 1 se muestran los elementos del carrito. Si se da a continue vamos al paso 2. 

En el paso 2 se validan los datos de envio del cliente, si se da a continue vamos al paso 3. 

En el paso 3 pasan muchas cosas: 
  
  Vamos a StripePaymentForm donde se configura el provider de stripe pasandole nuestra instancia y las options que se establecen con una llamada al microservicio payment-service donde se crea la session de pago con todo lo que hay que comprar y se devuelve la url de redirección de pagos.
  
  Nos aparece entonces la ventana de pagos de stripe, rellenamos los datos y cuando le damos a pay se actualiza la session con los datos de envio, se ejecuta confirm y stripe ejecuta el pago a la tarjeta de credito.
