// Variables globales
let cart = [];
const cartItemsElement = document.getElementById('cartItemsTable');
const cartCountElement = document.querySelector('.cart-count');
const cartEmptyElement = document.getElementById('emptyCart');
const cartContentElement = document.getElementById('cartContent');
const cartTotalElement = document.getElementById('cartTotal');
const checkoutBtnElement = document.getElementById('checkoutBtn');
const addToCartToast = document.getElementById('addToCartToast');

// Inicializar componentes cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Toasts de Bootstrap
    const toastElements = document.querySelectorAll('.toast');
    const toasts = [...toastElements].map(toastEl => new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 3000
    }));
    
    // Inicializar Modal del carrito
    const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
    
    // Añadir event listeners
    initEventListeners();
    
    // Inicializar animaciones al scroll
    initScrollAnimations();
    
    // Efecto de navbar scroll
    initNavbarScroll();
    
    // Inicializar carrito desde localStorage (si existe)
    loadCartFromStorage();
});

// Inicializar todos los event listeners
function initEventListeners() {
    // Event listener para los botones de "Añadir al carrito"
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', handleAddToCart);
    });
    
    // Event listener para abrir el modal del carrito
    document.getElementById('cartBtn').addEventListener('click', function() {
        const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
        cartModal.show();
    });
    
    // Event delegation para los botones de control de cantidad y eliminar en el carrito
    if (cartItemsElement) {
        cartItemsElement.addEventListener('click', function(e) {
            // Botón de incrementar cantidad
            if (e.target.classList.contains('quantity-inc')) {
                const productId = e.target.closest('tr').dataset.id;
                updateCartItemQuantity(productId, 1);
            }
            // Botón de decrementar cantidad
            else if (e.target.classList.contains('quantity-dec')) {
                const productId = e.target.closest('tr').dataset.id;
                updateCartItemQuantity(productId, -1);
            }
            // Botón de eliminar producto
            else if (e.target.classList.contains('remove-item') || e.target.closest('.remove-item')) {
                const productId = e.target.closest('tr').dataset.id;
                removeCartItem(productId);
            }
        });
    }
    
    // Botón de checkout
    document.getElementById('checkoutBtn').addEventListener('click', function() {
        // Aquí iría la lógica para proceder al pago
        alert('¡Gracias por tu compra! Este es un sitio de demostración.');
        clearCart();
        bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
    });
    
    // Smooth scrolling para enlaces de navegación
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 70,
                    behavior: 'smooth'
                });
                
                // Si hay un dropdown de navbar abierto, cerrarlo
                const navbarCollapse = document.querySelector('.navbar-collapse.show');
                if (navbarCollapse) {
                    const bsCollapse = new bootstrap.Collapse(navbarCollapse);
                    bsCollapse.hide();
                }
            }
        });
    });
}

// Manejar la adición de productos al carrito
function handleAddToCart(e) {
    const productCard = e.target.closest('.product-card');
    const productId = productCard.dataset.id;
    const productName = productCard.dataset.name;
    const productPrice = parseFloat(productCard.dataset.price);
    const productImg = productCard.querySelector('img').src;
    
    // Animar el botón
    e.target.classList.add('animate-shake');
    setTimeout(() => {
        e.target.classList.remove('animate-shake');
    }, 500);
    
    // Añadir al carrito
    addToCart({
        id: productId,
        name: productName,
        price: productPrice,
        image: productImg,
        quantity: 1
    });
    
    // Mostrar toast de confirmación
    const toast = new bootstrap.Toast(addToCartToast);
    toast.show();
}

// Añadir un producto al carrito
function addToCart(product) {
    // Verificar si el producto ya está en el carrito
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex > -1) {
        // Incrementar cantidad si ya existe
        cart[existingItemIndex].quantity += 1;
    } else {
        // Añadir nuevo item si no existe
        cart.push(product);
    }
    
    // Actualizar la UI del carrito
    updateCartUI();
    
    // Guardar carrito en localStorage
    saveCartToStorage();
}

// Actualizar la cantidad de un producto en el carrito
function updateCartItemQuantity(productId, change) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;
        
        // Eliminar el item si la cantidad es 0 o menos
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
        
        // Actualizar la UI del carrito
        updateCartUI();
        
        // Guardar carrito en localStorage
        saveCartToStorage();
    }
}

// Eliminar un producto del carrito
function removeCartItem(productId) {
    cart = cart.filter(item => item.id !== productId);
    
    // Actualizar la UI del carrito
    updateCartUI();
    
    // Guardar carrito en localStorage
    saveCartToStorage();
}

// Limpiar el carrito completamente
function clearCart() {
    cart = [];
    updateCartUI();
    saveCartToStorage();
}

// Actualizar la interfaz del carrito
function updateCartUI() {
    // Actualizar contador de items
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    cartCountElement.textContent = itemCount;
    
    // Mostrar/ocultar contenido relevante
    if (itemCount === 0) {
        cartEmptyElement.classList.remove('d-none');
        cartContentElement.classList.add('d-none');
        checkoutBtnElement.disabled = true;
    } else {
        cartEmptyElement.classList.add('d-none');
        cartContentElement.classList.remove('d-none');
        checkoutBtnElement.disabled = false;
    }
    
    // Limpiar tabla existente
    cartItemsElement.innerHTML = '';
    
    // Calcular total
    let total = 0;
    
    // Añadir items a la tabla
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const row = document.createElement('tr');
        row.dataset.id = item.id;
        row.classList.add('animate-fadeInDown');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <img src="${item.image}" class="product-img me-3" alt="${item.name}">
                    <div>
                        <h6 class="mb-0">${item.name}</h6>
                    </div>
                </div>
            </td>
            <td>$${item.price.toFixed(2)}</td>
            <td>
                <div class="quantity-control">
                    <button class="quantity-btn quantity-dec">-</button>
                    <input type="text" class="quantity-input" value="${item.quantity}" readonly>
                    <button class="quantity-btn quantity-inc">+</button>
                </div>
            </td>
            <td>$${itemTotal.toFixed(2)}</td>
            <td>
                <button class="remove-item">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        cartItemsElement.appendChild(row);
    });
    
    // Actualizar total
    cartTotalElement.textContent = `$${total.toFixed(2)}`;
}

// Guardar carrito en localStorage
function saveCartToStorage() {
    localStorage.setItem('sportshop_cart', JSON.stringify(cart));
}

// Cargar carrito desde localStorage
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('sportshop_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
}

// Inicializar animaciones al scroll
function initScrollAnimations() {
    const fadeElements = document.querySelectorAll('.fade-in');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.closest('section').classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    
    fadeElements.forEach(element => {
        observer.observe(element);
    });
}

// Efecto de cambio de navbar al hacer scroll
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    });
}


// JavaScript para la ruleta de promociones
document.addEventListener('DOMContentLoaded', function() {
    // Mostrar la ruleta al cargar la página, a menos que se haya desactivado
    if (!localStorage.getItem('ruletaDesactivada')) {
        setTimeout(() => {
            const ruletaModal = new bootstrap.Modal(document.getElementById('ruletaModal'));
            ruletaModal.show();
        }, 800); // Pequeño retraso para asegurar que la página ha cargado
    }

    // Elementos de la ruleta
    const girarRuletaBtn = document.getElementById('girarRuleta');
    const ruletaEl = document.getElementById('ruleta');
    const promoResult = document.getElementById('promo-result');
    const premioEl = document.getElementById('premio');
    const codigoPromocion = document.getElementById('codigo-promocion');
    const noMostrarMas = document.getElementById('noMostrarMas');
    const continuarTienda = document.getElementById('continuarTienda');

    // Premios disponibles en la ruleta
    const premios = [
        '10% OFF',
        '15% OFF',
        '5% OFF',
        'ENVÍO GRATIS',
        '20% OFF',
        'REGALO'
    ];

    // Códigos de promoción correspondientes a cada premio
    const codigosPremios = [
        'NINJA10',
        'NINJA15',
        'NINJA05',
        'ENVIOGRATIS',
        'SUPER20',
        'REGALO2025'
    ];

    // Variable para controlar si la ruleta está girando
    let isSpinning = false;

    // Función para generar un ángulo aleatorio entre 1080 y 1440 grados (3-4 vueltas)
    function generarAngulo() {
        // Generamos un ángulo base entre 3 y 4 vueltas completas (1080-1440 grados)
        let anguloBase = 1080 + Math.floor(Math.random() * 360);
        
        // Calculamos los ángulos centrales de cada sección
        const seccionAngulo = 360 / premios.length;
        
        // Elegimos un premio aleatorio
        const premioIndex = Math.floor(Math.random() * premios.length);
        
        // Calculamos el ángulo adicional para que termine en la sección elegida
        // Las secciones están divididas cada 60 grados (360/6)
        const anguloAdicional = premioIndex * seccionAngulo;
        
        // Sumamos un pequeño offset aleatorio dentro de la sección para que no siempre caiga en el centro
        const offset = Math.floor(Math.random() * (seccionAngulo * 0.7)) - (seccionAngulo * 0.35);
        
        // El ángulo final será la suma del ángulo base más el ángulo adicional y el offset
        return anguloBase + anguloAdicional + offset;
    }

    // Evento al hacer clic en el botón de girar
    girarRuletaBtn.addEventListener('click', function() {
        if (isSpinning) return;
        
        isSpinning = true;
        promoResult.classList.add('d-none');
        girarRuletaBtn.disabled = true;
        
        // Generamos el ángulo aleatorio
        const angulo = generarAngulo();
        
        // Giramos la ruleta
        ruletaEl.style.transform = `rotate(${angulo}deg)`;
        
        // Después de la animación, mostramos el resultado
        setTimeout(() => {
            // Calculamos qué premio ha tocado basándonos en el ángulo final
            // El ángulo final es el remainder de dividir el ángulo por 360
            const anguloFinal = angulo % 360;
            
            // Cada sección ocupa 60 grados (360/6)
            const seccionAngulo = 360 / premios.length;
            const premioIndex = 5 - Math.floor(anguloFinal / seccionAngulo);
            const premioActual = premios[premioIndex % premios.length];
            const codigoActual = codigosPremios[premioIndex % premios.length];
            
            // Mostramos el resultado
            premioEl.textContent = premioActual;
            codigoPromocion.textContent = codigoActual;
            promoResult.classList.remove('d-none');
            
            // Guardamos el código en localStorage para usarlo en la tienda
            localStorage.setItem('promocionActiva', codigoActual);
            localStorage.setItem('premioDescript', premioActual);
            
            // Habilitamos el botón nuevamente
            setTimeout(() => {
                girarRuletaBtn.disabled = false;
                isSpinning = false;
                girarRuletaBtn.textContent = 'Girar otra vez';
            }, 500);
        }, 4100); // Esperar a que termine la animación (4s + 100ms)
    });

    // Evento al hacer clic en no mostrar más
    noMostrarMas.addEventListener('change', function() {
        if (this.checked) {
            localStorage.setItem('ruletaDesactivada', 'true');
        } else {
            localStorage.removeItem('ruletaDesactivada');
        }
    });

    // Evento al hacer clic en continuar a la tienda
    continuarTienda.addEventListener('click', function() {
        // Podemos añadir alguna lógica adicional aquí si es necesario
        // Por ejemplo, mostrar un banner con el premio ganado
        const premio = localStorage.getItem('premioDescript');
        const codigo = localStorage.getItem('promocionActiva');
        
        if (premio && codigo) {
            // Aquí podrías mostrar un banner o alguna notificación en la tienda
            console.log('Premio ganado:', premio, 'Código:', codigo);
        }
    });
});


