const fs = require('fs');
const path = require('path');
const { stringify } = require('querystring');


function slugify (str, replaceFullStops) {
    // the 11ty slug filter doesn't remove full stops
    // bootstrap doesn't like ids that have full stops so the option to replace them or not was added
    // specifically full stops in the accordion ids was stopping them from working.

    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();

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
module.exports = {

    slugify,
    asAccordion: function (data) {
        
        let topics = data.reduce((result, current, index) => {

            let keyword = slugify(current.keyword);
            if (result[keyword]) {
                result[keyword].push(current);
            } else {
                result[keyword] = [current];
            }
            return result;
        }, {});

        let cards = Object.keys(topics).map((topicName, index) => {
           
            let topic = topics[topicName];

            let courses = topic.map(course=>{
                return `<div><a href="/saved_searches/${slugify(course.location)}/${slugify(course.keyword)}/${slugify(course.title)}.html">${course.title}</a></div>`;
            });
            let card = `<div class="card">
                            <div class="card-header" id="headingOne">
                                <h2 class="mb-0">
                                    <button class="btn btn-block text-left" type="button" data-toggle="collapse" 
                                        data-target="#${slugify(topicName, true)}" aria-expanded="${index==0}" aria-controls="collapseOne">
                                    ${ topic[0].keyword }
                                    </button>
                                </h2>
                            </div>    
                            <div id="${slugify(topicName, true)}" class="collapse ${index == 0 ? 'show' :''}" aria-labelledby="headingOne" data-parent="#savedSearchAccordion">
                                <div class="card-body">
                                    ${courses.join("")}
                                </div>
                            </div>
                        </div>`;
            return card;
            
        });
        let accordion = `<details class="accordion" id="savedSearchAccordion"> 
                <summary>Saved Searches</summary>   
                ${cards.join("")}
        </details>`;

        html = `<section id="savedsearches" class="section">
                    <div class="container">
                        <div class="col">
                        
                        ${accordion}
                        </div>
                    </div>
                </section>`;
        return html;

    }, 
    keywordInfo: function (keyword, courseList) {
        
        html=`<section>
        <table class="table">
        <thead>
            <tr>
            <th>Name</th><th>Description</th>
            </tr> 
        </thead>
        <tbody>`;
        

        courses = courseList.filter(course=>course.searchWords.indexOf(`${keyword},`))
            .map(course => `<tr><td>${ course.name }</td><td>${ course.descrip }</td></tr>`).join("");

/*
            .forEach(course => `<tr>
                    <td><a href="/courses/{{ course.name | slug }}/">{{ course.name }}</a></td>
                    <td>{{ course.descrip}}</td>
                </tr>`)
            .join("");
  */
        html += courses;

        html += `</tbody></table></section>`;


        
        return html;
    },
    makeSection: function(section) {

        let rawData = fs.readFileSync(`${__dirname}/../_data/site.json`);
        let site = JSON.parse(rawData);


        let html;
        let list;
        
        let animationDelay = `data-aos-delay="${site.animation.delay ? site.animation.delay : 0}"`;
        let animationOffset = `data-aos-offset="${section.animation ? section.animation.offset : site.animation.defaultOffset }"`;

        switch (section.type) {
            case 'text':
                html = `<section id="${section.id}" class="section">
                            <h1>${section.title}</h1>
                            <p>${section.content}</p>
                        </section>`;
                break;
            
            case 'placeholder':
                html = ``;
                break;

            case 'banner':

                html = `<section class="section banner">
                        <div class="container">
                        <div class="row">
                            <div class="col-md-6" data-aos="fade-left" ${animationDelay}>
                            <p class="promo-title">${ section.title }</p>
                            <p class="join-title">${ section.subtitle }</p>
                            </div>
                            <div class="col-md-6" data-aos="fade-right" ${animationDelay}>
                                <img src="${ section.image }" alt="" class="img-fluid">
                            </div>
                        </div>
                        </div>
                        <!--- Background wave Hero ---->
                        <img src="${ section.background }" class="bottom-img" alt="">
                    </section>`;
                break;

            case "keywordtext":

                try {
                    list = `<ul>${section.content.list.map(item=>`<li>${item}</li>`).join("")}</ul>`;

                } catch(error) {
                    list = `<ul></ul>`;
                    console.log(`***** metadata error section.content.list is missing - keywordtext *****`);  

                }

                try {
                    text = `<ul>${section.content.text.map(item=>`<p>${item}</p>`).join("")}</ul>`;

                } catch(error) {
                    text = `<ul></ul>`;
                    console.log(`***** metadata error section.content.text is missing - keywordtext *****`);  

                }

                let defaultTemplate = `${site.searchKeywords[0]} is one of the most popular coding languages in the world. The job market for ${ site.searchKeywords[0] } developers is robust and consistent, making it a great programming language to learn. Our courses can give you the skills you need to work effectively with ${ site.searchKeywords[0] }.  Why attend one of our ${ site.searchKeywords[0] } courses? If you're interested working effectively with ${ site.searchKeywords[0] } to benefit your organisation and to get an edge over your competitors, or simply to learn a highly lucrative skill then you should consider our ${ site.searchKeywords[0] } training course.</p>`
                
                html = `<section id="${section.id}" class="section">
                    <div class="container">
                    <h3 class="title text-center">${ section.title }</h3>
                    <div class="row ${section.imagePosition=="left" ? "flex-row-reverse" :""}">
                        <div class="${section.image ? 'col-md-6' : 'col-md-12'} about" 
                        data-aos="fade-left" ${ animationDelay } ${animationOffset}
                        data-aos-anchor="#${section.id}"
                        >
                        <p class="about-title">${ section.content.title1 }</p>
                        <p>${ section.content.text1 }</p>
                        <p class="about-title">${ section.content.title2 }</p>
                        <p>${ section.content.text2 }</p>
                        
                        </div>`;

                    if (section.image) {
                        html += `<div class="col-md-6" 
                                data-aos="fade-right" ${ animationDelay }  ${animationOffset}
                                data-aos-anchor="#${section.id}"
                                >
                                    <img src="${ section.image }" 
                                        ${section.imageWidth ? 'width=\"' :''} 
                                        ${section.imageWidth ? '' + section.imageWidth + '\"':''}   
                                        class="img-fluid" alt="">                                 
                                </div>`;
                    }    

                html += `</div>
                    </div>
                </section>`;
                break;

            case "summary":

                try {
                    list = `<ul>${section.content.list.map(item=>`<li>${item}</li>`).join("")}</ul>`;
                } catch(error) {
                    list = `<ul></ul>`;
                    console.log(`***** metadata error section.content.list is missing - summary *****`);
                }

                try {
                    text = `<ul>${section.content.text.map(item=>`<p>${item}</p>`).join("")}</ul>`;

                } catch(error) {
                    text = `<ul></ul>`;
                    console.log(`***** metadata error section.content.list is missing - keywordtext *****`);  

                }
                
                html = `<section id="${section.id}" class="section">
                    <div class="container">
                    <h3 class="title text-center">${ section.title }</h3>
                    <div class="row ${section.imagePosition=="left" ? "flex-row-reverse" :""}">
                        <div class="${section.image ? 'col-md-6' : 'col-md-12'} about"
                        data-aos="fade-left" ${ animationDelay } ${animationOffset}
                        data-aos-anchor="#${section.id}"
                        >
                        <p class="about-title">${ section.content.title }</p>
                        
                        ${text}
                        
                        ${list}
                        
                        </div>`;
                    if (section.image) {
                        html += `<div class="col-md-6"
                                data-aos="fade-right" ${ animationDelay }  ${animationOffset}
                                data-aos-anchor="#${section.id}"
                        >
                                
                        <img src="${ section.image }" 
                            ${section.imageWidth ? 'width=\"' :''} 
                            ${section.imageWidth ? '' + section.imageWidth + '\"':''}
                            class="img-fluid" alt="">
                                </div>`;
                    }    
    
                html += `</div>
                    </div>
                </section>`;
                break;

            case 'quotes':
                let quotes = section.content.quotes.map((quote, index) => `<div class="col-md-5 testimonials" data-aos="fade-left" data-aos-delay="${ site.animation.delay * (index + 1) }" ${animationOffset}>
                    <p class="feedback">"${quote.text}"</p>
                    <img src="${quote.image}"  alt="">
                    <p class="user-details"><b>${quote.name}</b><br>${ quote.jobtitle }</p>
                    </div>`).join("");

                html = `<section id="${ section.id }" class="section">
                            <div class="container">
                            <h3 class="title text-center">${ section.text }</h3>
                            <div class="row offset-1">
                                ${quotes}
                            </div>
                            </div>
                        </section>`;
                break;

            default: 
                html = `<section id="${section.id}" class="section"><code>${JSON.stringify(section)}</code></section>`;
                break;
        }
        return html;
    }
}



