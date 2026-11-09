const fs = require('fs');


function slugify (str, replaceFullStops) {
    // the 11ty slug filter doesn't remove full stops
    // bootstrap doesn't like ids that have full stops so the option to replace them or not was added
    // specifically full stops in the accordion ids was stopping them from working.

    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();

    // keep "C#" / "C++" distinct from "C", and keep "#" out of URLs
    str = str.replace(/#/g, ' sharp').replace(/\+/g, ' plus');

    // remove accents, swap ñ for n, etc
    var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
    var to   = "aaaaeeeeiiiioooouuuunc------";
    for (var i = 0, l = from.length ; i<l ; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    if (replaceFullStops) {
        str = str.replace(/[^a-z0-9 -]/g, '');
    } else {
        str = str.replace(/[^a-z0-9 -.]/g, ''); // remove invalid chars
    }

    str = str.replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-'); // collapse dashes

    return str;

}

function escapeAttr(str = "") {
    return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

// optional image beside a section; decorative unless imageAlt is given
function sectionImage(section) {
    if (!section.image) return "";
    let width = section.imageWidth ? ` width="${escapeAttr(section.imageWidth)}"` : "";
    return `<img class="topic__image" src="${section.image}"${width} alt="${escapeAttr(section.imageAlt || "")}" loading="lazy">`;
}

// decorative illustration, e.g. { "src": "/img/undraw-teacher.svg", "width": 960, "height": 621 }
// width/height reserve the space so the page doesn't jump while it loads
function illustration(item, className, lazy = true) {
    if (!item || !item.src) return "";
    let size = item.width && item.height ? ` width="${item.width}" height="${item.height}"` : "";
    return `<img class="illustration ${className}" src="${item.src}"${size} alt="${escapeAttr(item.alt || "")}"${lazy ? ' loading="lazy"' : ""}>`;
}

function toItems(value) {
    return Array.isArray(value) ? value : [];
}

module.exports = {

    slugify,

    // index of landing pages, grouped by keyword, e.g. "Python Training" -> Dublin, Cork, ...
    asAccordion: function (data, image) {

        let topics = data.reduce((result, current) => {
            let keyword = slugify(current.keyword);
            (result[keyword] = result[keyword] || []).push(current);
            return result;
        }, {});

        let items = Object.keys(topics).map(topicName => {
            let topic = topics[topicName];
            let links = topic.map(search => `<li><a href="/saved_searches/${slugify(search.location)}/${slugify(search.keyword)}/${slugify(search.title)}.html"><span class="visually-hidden">${search.keyword} courses in </span>${search.location}</a></li>`);
            return `<li class="topic-index__item">
                        <h3>${topic[0].keyword}</h3>
                        <ul class="topic-index__places">${links.join("")}</ul>
                    </li>`;
        });

        return `<section id="savedsearches" class="topic-index" aria-labelledby="topic-index-heading">
                    <div class="wrap">
                        <div class="split${image ? "" : " split--text-only"}">
                            <div class="split__text">
                                <h2 id="topic-index-heading">Find training by topic and location</h2>
                                <p>Every topic we teach, with course pages for Dublin, Cork, Limerick and the rest of Ireland.</p>
                            </div>
                            ${illustration(image, "split__image")}
                        </div>
                        <details>
                            <summary>Show all ${items.length} topics</summary>
                            <ul class="topic-index__list">${items.join("")}</ul>
                        </details>
                    </div>
                </section>`;
    },

    keywordInfo: function (keyword, courseList) {

        let rows = courseList.filter(course => course.searchWords.indexOf(`${keyword},`) != -1)
            .map(course => `<tr><td>${ course.name }</td><td>${ course.descrip }</td></tr>`).join("");

        return `<section><div class="table-wrap"><table class="data-table">
                    <thead><tr><th scope="col">Name</th><th scope="col">Description</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table></div></section>`;
    },

    makeSection: function(section) {

        let html;

        switch (section.type) {
            case 'text': {
                // content can be one paragraph (string) or several (array)
                let paragraphs = Array.isArray(section.content) ? section.content : [section.content];
                html = `<section id="${section.id}" class="topic">
                            <div class="wrap split${section.illustration ? "" : " split--text-only"}">
                                <div class="split__text prose">
                                    <h2>${section.title}</h2>
                                    ${paragraphs.map(text => `<p>${text}</p>`).join("")}
                                </div>
                                ${illustration(section.illustration, "split__image")}
                            </div>
                        </section>`;
                break;
            }

            case 'placeholder':
                html = ``;
                break;

            case 'banner': {
                let actions = section.actions || [
                    { text: "Browse courses", link: "/courses/" },
                    { text: "See course dates", link: "/schedule/" }
                ];
                let actionLinks = actions.map((action, index) =>
                    `<a class="button${index > 0 ? ' button--quiet' : ''}" href="${action.link}">${action.text}</a>`).join("");

                // the hero illustration: an AI request being typed, then answered (see js/site.js)
                let media = "";
                if (section.prompt) {
                    let reply = toItems(section.prompt.reply).map((line, i) => `<li style="--i:${i}">${line}</li>`).join("");
                    media = `<figure class="prompt" data-prompt>
                                <div class="prompt__window" aria-hidden="true">
                                    <p class="prompt__label">You</p>
                                    <p class="prompt__ask"><span class="prompt__text">${section.prompt.text}</span></p>
                                    <p class="prompt__label">Assistant</p>
                                    <ul class="prompt__reply">${reply}</ul>
                                </div>
                                <figcaption>${section.prompt.caption || ""}</figcaption>
                            </figure>`;
                } else if (section.illustration) {
                    media = illustration(section.illustration, "hero__image", false);
                } else if (section.image) {
                    media = `<img class="hero__image" src="${section.image}" alt="${escapeAttr(section.imageAlt || "")}">`;
                }

                html = `<section class="hero" id="${section.id || 'banner'}">
                            <div class="wrap hero__inner">
                                <div class="hero__copy">
                                    <h1 class="hero__title">${ section.title }</h1>
                                    <p class="hero__lead">${ section.subtitle }</p>
                                    <p class="hero__actions">${actionLinks}</p>
                                    ${section.prompt ? illustration(section.illustration, "hero__illustration", false) : ""}
                                </div>
                                <div class="hero__media">${media}</div>
                            </div>
                        </section>`;
                break;
            }

            case "keywordtext":
                html = `<section id="${section.id}" class="topic">
                    <div class="wrap topic__inner">
                        <div class="topic__head">
                            <h2 class="topic__title">${ section.title }</h2>
                            ${sectionImage(section)}
                        </div>
                        <div class="topic__body prose">
                            <h3>${ section.content.title1 }</h3>
                            <p>${ section.content.text1 }</p>
                            <h3>${ section.content.title2 }</h3>
                            <p>${ section.content.text2 }</p>
                        </div>
                    </div>
                </section>`;
                break;

            case "summary": {
                let text = toItems(section.content.text).map(item => `<p>${item}</p>`).join("");
                let list = toItems(section.content.list);
                html = `<section id="${section.id}" class="topic">
                    <div class="wrap topic__inner">
                        <div class="topic__head">
                            <h2 class="topic__title">${ section.title }</h2>
                            ${sectionImage(section)}
                        </div>
                        <div class="topic__body prose">
                            ${section.content.title ? `<h3>${section.content.title}</h3>` : ""}
                            ${text}
                            ${list.length ? `<ul>${list.map(item => `<li>${item}</li>`).join("")}</ul>` : ""}
                        </div>
                    </div>
                </section>`;
                break;
            }

            case 'quotes': {
                let quotes = section.content.quotes.map(quote => `<figure class="quote">
                        <blockquote><p>${quote.text}</p></blockquote>
                        <figcaption>
                            ${quote.image ? `<img src="${quote.image}" alt="" width="48" height="48" loading="lazy">` : ""}
                            <span><strong>${quote.name}</strong><br>${ quote.jobtitle }</span>
                        </figcaption>
                    </figure>`).join("");

                html = `<section id="${ section.id }" class="topic topic--quotes">
                            <div class="wrap">
                                <h2 class="topic__title">${ section.title || section.text }</h2>
                                <div class="quotes">${quotes}</div>
                            </div>
                        </section>`;
                break;
            }

            default:
                html = `<section id="${section.id}" class="topic"><div class="wrap"><code>${JSON.stringify(section)}</code></div></section>`;
                break;
        }
        return html;
    }
}
