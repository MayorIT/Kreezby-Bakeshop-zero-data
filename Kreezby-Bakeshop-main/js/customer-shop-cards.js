/**
 * Uiverse-style flavor cards for customer shop grids.
 */
(function () {
    'use strict';

    var PLUS_SVG =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>';

    function imgFallback(name) {
        var label = encodeURIComponent(name);
        return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%25' height='100%25' fill='%23eee'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='10' fill='%23999'>" + label + '</text></svg>';
    }

    function flavorCardHtml(prod, options) {
        var guest = options && options.guest;
        var onerror = "this.src='" + imgFallback(prod.name) + "'";
        var footerButton = guest
            ? ''
            : '<button type="button" class="flavor-card__button" onclick="commitItemToCartState(\'' + prod.id + '\')" aria-label="Add ' + prod.name + ' to cart">' +
                PLUS_SVG +
              '</button>';

        var actions = guest
            ? '<div class="guest-action-group">' +
                '<button type="button" class="btn-view-only" disabled>View Only (Guest)</button>' +
                '<a href="../auth/log_in.html" class="btn-guest-action">Order Now</a>' +
              '</div>'
            : '<div class="flavor-card__actions">' +
                '<div class="counter-widget">' +
                    '<button type="button" class="counter-btn" onclick="adjustCardWidgetQtyState(\'' + prod.id + '\', -1)">-</button>' +
                    '<span class="counter-value" id="qty-val-' + prod.id + '">1</span>' +
                    '<button type="button" class="counter-btn" onclick="adjustCardWidgetQtyState(\'' + prod.id + '\', 1)">+</button>' +
                '</div>' +
                '<button type="button" class="add-cart-btn" onclick="commitItemToCartState(\'' + prod.id + '\')">Add To Cart Bag</button>' +
              '</div>';

        return (
            '<article class="flavor-card">' +
                '<div class="flavor-card__shine" aria-hidden="true"></div>' +
                '<div class="flavor-card__glow" aria-hidden="true"></div>' +
                '<div class="flavor-card__content">' +
                    '<span class="flavor-card__badge">Fresh</span>' +
                    '<div class="flavor-card__image">' +
                        '<img src="' + prod.img + '" alt="' + prod.name + '" onerror="' + onerror + '">' +
                    '</div>' +
                    '<div class="flavor-card__text">' +
                        '<h4 class="flavor-card__title">' + prod.name + '</h4>' +
                        '<p class="flavor-card__description">' + prod.variant + '</p>' +
                    '</div>' +
                    '<div class="flavor-card__footer">' +
                        '<span class="flavor-card__price">₱' + prod.cost.toFixed(2) + '</span>' +
                        footerButton +
                    '</div>' +
                    actions +
                '</div>' +
            '</article>'
        );
    }

    function renderShopMenuGridCards(catalog, containerId, options) {
        var grid = document.getElementById(containerId || 'shop-menu-container');
        if (!grid || !catalog || !catalog.length) return;
        grid.innerHTML = catalog.map(function (prod) {
            return flavorCardHtml(prod, options);
        }).join('');
    }

    window.KreezbyFlavorCards = {
        render: renderShopMenuGridCards,
        html: flavorCardHtml
    };
})();
