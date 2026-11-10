// Small progressive enhancements. Every page works without this file.

(function () {
    // Mobile menu
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.getElementById("site-menu");
    if (toggle && menu) {
        var setOpen = function (open) {
            toggle.setAttribute("aria-expanded", String(open));
            menu.classList.toggle("is-open", open);
        };
        toggle.addEventListener("click", function () {
            setOpen(toggle.getAttribute("aria-expanded") !== "true");
        });
        menu.addEventListener("click", function (event) {
            if (event.target.closest("a")) setOpen(false);
        });
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
                setOpen(false);
                toggle.focus();
            }
        });
    }

    // Booking links: dates that have passed show "Completed" instead of a Book button
    document.querySelectorAll("[data-course-date]").forEach(function (link) {
        var parts = link.getAttribute("data-course-date").split("-").map(Number);
        var courseDate = new Date(parts[0], parts[1] - 1, parts[2]);
        if (!(courseDate > new Date())) {
            var done = document.createElement("span");
            done.className = "status-done";
            done.textContent = "Completed";
            link.replaceWith(done);
        }
    });

    // Section illustrations and testimonial cards ease in as they come into view
    // (the CSS keeps them hidden until then; see "Scroll-in animations" in style.css).
    // Ones already on screen when the page loads animate straight away.
    var animated = document.querySelectorAll(".topic .split__image, .quote, .cta__inner");
    var reveal = function (el) {
        if (el.classList.contains("is-visible")) return;
        el.classList.add("is-visible");
        var settle = function () {
            el.classList.add("is-settled");
            el.style.removeProperty("--i");
        };
        // settle when the move finishes, or after 2s in case that event never comes
        var fallback = setTimeout(settle, 2000);
        el.addEventListener("transitionend", function done(event) {
            if (event.target !== el || event.pseudoElement || event.propertyName !== "transform") return;
            clearTimeout(fallback);
            settle();
            el.removeEventListener("transitionend", done);
        });
    };

    animated.forEach(function (el) {
        // testimonial cards side by side arrive one after another
        if (el.classList.contains("quote")) {
            var cards = el.parentElement.querySelectorAll(":scope > .quote");
            el.style.setProperty("--i", Array.prototype.indexOf.call(cards, el));
        }
    });

    if ("IntersectionObserver" in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    reveal(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: "0px 0px -10% 0px" });
        animated.forEach(function (el) { observer.observe(el); });
    } else {
        animated.forEach(reveal);
    }
})();
