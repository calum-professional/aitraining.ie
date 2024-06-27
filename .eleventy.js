let branding = require('./src/_data/branding.json');
let site = require('./src/_data/site.json');
let fs = require('fs');
let { makeSection, slugify, asAccordion, keywordInfo } = require('./src/_includes/makeSection');

// this function makes a string safe for json
// it removes the newline characters
// TBD: fix quotation marks
function makeSafeForJson(item) {
    return item.replaceAll(/[\r\n]/gm, "");
}

// this function formats date strings in ISO Date format

function getInstanceDateInfo(strDate, duration) {

    let startDate = new Date(strDate);
    startDate.setHours(10);
    startDate.setMinutes(30);
    let endDate = new Date(strDate);
    endDate.setDate(endDate.getDate() + parseInt(duration));
    endDate.setHours(17);
    endDate.setMinutes(0);

    return {
        startDate:`${startDate.toISOString()}`, 
        endDate:`${endDate.toISOString()}`, 
        duration:`P${duration}D`
    }
}

function getLocationInfo(instance, course) {

    let location = {
        
    };

    let filename = slugify(course.name);

    if (instance.location == 'Online') {
        location["@type"] = "VirtualLocation";
        location.url = `https://professional.ie/course_schedule/${filename}.html?id=${instance.id}`;
        
    } else {

        
        location["@type"] = 'Place';
        location.sameAs = "https://professional.ie";
        location.name = `Professional Training ${instance.location}`;

        if (instance.location == "Dublin") {
            location.address = {
                "@type" : "PostalAddress",
                "streetAddress" : "Unit 22, Westland Square, Pearse Street",
                "addressRegion" : "Dublin 2",
                "postalCode" : "D02 W102"
            }
        } else {
            location.address = {
                "@type": "PostalAddress", 
                "streetAddress" : "Unit E, Building 6500, Cork Airport Business Park", 
                "addressRegion" : "Cork", 
                "postalCode": "T12 TP8H"
            }
        }
    }
    return {location};
}

module.exports = function(config) {

    /* config.addFilter("makeSection", function(content) {
        return `<div>
                    <h1>${content.title}</h1>
                    <p>${content.text}</p>
                </div>`;
    }); */

    config.addFilter("json", function(item){
        return JSON.stringify(item);
    });

    config.addFilter("makebold", function(item){
        return `<b>${item}</b>`;
    })

    // this filter is to fix the problem with the Azure and other MS courses where there is a : in the name
    config.addFilter("removeInvalidChars", function(filename) {
        //console.log(filename);
        return filename.replace(/:/ig, "-");
    });

    config.addFilter("slugify", slugify);
    
    config.addFilter("asAccordion", asAccordion);

    // this filter will join the values in an array together
    // needed to put keywords into title in schedule
    // call using {{ site.searchKeywords | join }} from a markdown file
    // you can specify the join character {{ site.searchKeywords | join:"+" }}
    config.addFilter("join", function(arr, joinChar=" ") {
        return arr.join(joinChar);
    });

    // this filter will strip out newline characters and quotation marks from json text
    // used to format the description for the ld+json metadata
    config.addFilter("jsonsafe", function(description){

        return makeSafeForJson(description);
    });

    config.addFilter("testparam", function(item, a, b) {
        return `${item}-${a}-${b}-like`;
    });

    config.addFilter("keywordInfo", keywordInfo);

    config.addFilter("formatScheduleInstance", function(instance, formatType="metadata",courseItem=null) {
  
        let filename = slugify(courseItem.name);
      
       switch(formatType) {
            case "table":
                return `<tr>
                    <td>${instance.name}</td>
                    <td>${instance.date}</td>
                    <td>${instance.location}</td>
                    <td>
                        <script>
                        {
                        
                            displayIfDateInFuture("${instance.date}", '<a class="btn btn-primary" href="https://www.professional.ie/course_schedule/${filename}.html?id=${instance.id}">Book</a>','<span>Completed</span>');

                        }
                        </script>
                    </td>
                    </tr>`;
                break;
            case "metadata":
                let metadata = {
                    "@context":"http://schema.org", 
                    "@type": "EducationEvent", 
                    name: `${ courseItem.name }`, 
                    image: `${site.url}${site.logo}`, 
                    description: `${makeSafeForJson(courseItem.descrip)}`, 
                    ...getInstanceDateInfo(instance.date, courseItem.durationDays), 
                    eventStatus: "https://schema.org/EventScheduled", 
                    eventAttendanceMode: `https://schema.org/${instance.location == 'Online' ? "OnlineEventAttendanceMode" : "OfflineEventAttendanceMode"}`,
                    offers: {
                        "@type": "Offer", 
                        "url":`https://professional.ie/course_schedule/${filename}.html?id=${instance.id}`, 
                        "priceCurrency": "EUR", 
                        "price": `${courseItem.cost}`, 
                        "availability": "https://schema.org/InStock",
                        "validFrom": `${new Date().getFullYear()}-01-01T12:00`
                    }, 
                    ...getLocationInfo(instance, courseItem), 
                    "organizer": {
                        "@type": "Organization", 
                        "name": "Professional Training", 
                        "url": "www.professional.ie"
                    }
                    
                }
                return JSON.stringify(metadata);
                break;
            default:
                return `<!-- unknown format -->`;
                break;

        }
    })
    
    config.addPassthroughCopy({"./src/img/*.*": "img"});
    
    config.addPassthroughCopy({"./src/img/testimonials/*.*": "img/testimonials"});
    config.addPassthroughCopy({"./src/css/*.*": "css"});
    config.addPassthroughCopy({"./src/js/*.*": "js"});
    

    config.setTemplateFormats("html,njk,md,svg");

    config.addFilter("makeSection", makeSection);

    config.addFilter("convertLineBreaks", function(text) {
        return text.replace(/\r\n/g, "<br>");
    })

    return {
        templateFormats: ["html", "njk", "svg"], 
        dir: {
            input: './src', 
            output: './build', 
            layouts: '/_includes/layout'
        }
    };
};