// Small progressive enhancements. Every page works without this file.

(function () {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    // Hero: type the example request, then reveal the answer
    var prompt = document.querySelector("[data-prompt]");
    if (prompt) {
        var textEl = prompt.querySelector(".prompt__text");
        var fullText = textEl ? textEl.textContent : "";
        var answer = function () { prompt.classList.add("is-answered"); };

        if (reduceMotion || !textEl) {
            answer();
        } else {
            textEl.textContent = "";
            prompt.classList.add("is-typing");
            var i = 0;
            setTimeout(function type() {
                i += 1;
                textEl.textContent = fullText.slice(0, i);
                if (i < fullText.length) {
                    setTimeout(type, 28 + Math.random() * 40);
                } else {
                    setTimeout(function () {
                        prompt.classList.remove("is-typing");
                        answer();
                    }, 450);
                }
            }, 700);
        }
    }
})();
