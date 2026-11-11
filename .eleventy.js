let branding = require('./src/_data/branding.json');
let site = require('./src/_data/site.json');
let fs = require('fs');
let slugifyPackage = require('slugify'); // pinned to 1.5.3, see the "slug" filter
let { makeSection, slugify, asAccordion, keywordInfo } = require('./src/_includes/makeSection');

// this function makes a string safe for json
// it removes the newline characters
// TBD: fix quotation marks
function makeSafeForJson(item) {
    return item.replaceAll(/[\r\n]/gm, "");
}

// "2026-10-12" -> "Mon 12 Oct 2026"
function displayDate(strDate) {
    if (!strDate) return "";
    let [year, month, day] = String(strDate).split("-").map(Number);
    let date = new Date(Date.UTC(year, month - 1, day));
    if (isNaN(date)) return strDate;
    return date.toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

// course outline text arrives as newline-separated topics; show those as a list
function courseText(text) {
    let lines = String(text || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length <= 1) return `<p>${lines.join("")}</p>`;
    return `<ul>${lines.map(line => `<li>${line}</li>`).join("")}</ul>`;
}

// course length in days from the API's durationDays, e.g. 0.5, 1, 3 ("" or 0 when not set)
function durationInDays(duration) {
    let days = parseFloat(duration);
    return days > 0 ? days : 0;
}

// how a course length reads on the site: "Half day", "1 day", "1.5 days", "3 days".
// Returns "" when the course has no length set, so templates can leave it out.
function formatDuration(duration) {
    let days = durationInDays(duration);
    if (!days) return "";
    if (days < 0.5) return "Under half a day";
    if (days == 0.5) return "Half day";
    return `${days} ${days == 1 ? "day" : "days"}`;
}

// first scheduled date that hasn't passed yet ("" if none), as of the build
function nextDate(schedule) {
    let today = new Date().toISOString().slice(0, 10);
    let next = (schedule || []).find(instance => instance.date > today);
    return next ? next.date : "";
}

// start, end and length of one scheduled date, for structured data.
// A day runs 10:30 to 17:00; a course of n days ends on its nth day, and a
// course shorter than a day ends partway through its first day.
function getInstanceDateInfo(strDate, duration) {

    let days = durationInDays(duration);
    let startDate = new Date(strDate);
    startDate.setHours(10, 30, 0, 0);

    let endDate = new Date(strDate);
    if (days > 0 && days < 1) {
        endDate = new Date(startDate.getTime() + days * 6.5 * 60 * 60 * 1000);
    } else {
        endDate.setDate(endDate.getDate() + Math.max(Math.ceil(days), 1) - 1);
        endDate.setHours(17, 0, 0, 0);
    }

    let info = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
    };
    if (days) info.duration = `P${days}D`;
    return info;
}

// the offices, with their addresses from site.json
const offices = {
    Cork: { address: site.address, phone: site.phone },
    Dublin: { address: site.addressDublin, phone: site.phoneDublin },
    Limerick: { address: site.addressLimerick, phone: site.phoneLimerick }
};

// schema.org PostalAddress for one of the offices above
function postalAddress(city) {
    let address = offices[city].address;
    return {
        "@type": "PostalAddress",
        streetAddress: [address.line1, address.line2, address.town].filter(Boolean).join(", "),
        addressLocality: city,
        addressRegion: address.county,
        postalCode: address.postcode,
        addressCountry: "IE"
    };
}

function getLocationInfo(instance, course) {

    let location = {};

    let filename = slugify(course.name);

    if (instance.location == 'Online') {
        location["@type"] = "VirtualLocation";
        location.url = `https://professional.ie/course_schedule/${filename}.html?id=${instance.id}`;
    } else {
        // classes outside our offices fall back to Cork, as before
        let city = offices[instance.location] ? instance.location : "Cork";
        location["@type"] = 'Place';
        location.sameAs = "https://professional.ie";
        location.name = `Professional Training ${city}`;
        location.address = postalAddress(city);
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
        // ":" becomes "-", other characters Windows doesn't allow in file names are dropped (e.g. "Excel ***")
        return filename.replace(/:/ig, "-").replace(/[*?"<>|]/g, "");
    });

    config.addFilter("slugify", slugify);

    // Eleventy 0.12's slug filter, kept so page URLs don't change: newer slugify
    // versions turn "Situations – Call" into "situations-call" instead of "situations---call"
    config.addFilter("slug", str => slugifyPackage(str, { replacement: "-", lower: true }));

    config.addFilter("displayDate", displayDate);

    // one office address from site.json on a single line, skipping any blank lines,
    // e.g. "26 Upper Pembroke Street, Dublin 2 D02 X361"
    config.addFilter("formatAddress", function(address) {
        return [address.line1, address.line2, address.town, address.county, address.postcode].map(part => (part || "").trim()).filter(Boolean).join(", ");
    });

    // all office addresses as JSON, for structured data
    config.addShortcode("officeAddresses", () =>JSON.stringify(Object.keys(offices).map(postalAddress)));
    config.addFilter("courseText", courseText);

    // first scheduled date that hasn't passed yet ("" if none), as of the build
    config.addFilter("nextDate", nextDate);

    config.addFilter("formatDuration", formatDuration);

    // the line under each course in course lists, e.g. "Half day, next date Fri 13 Nov 2026"
    config.addFilter("courseMeta", function(course) {
        let duration = formatDuration(course.durationDays);
        let next = nextDate(course.schedule);
        let nextText = next ? `next date ${displayDate(next)}` : "";
        if (duration && nextText) return `${duration}, ${nextText}`;
        return duration || (nextText ? "N" + nextText.slice(1) : "");
    });
    config.addShortcode("year", () => `${new Date().getFullYear()}`);
    
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
                // js/site.js swaps the Book link for "Completed" once the date has passed
                return `<tr>
                    <td><time datetime="${instance.date}">${displayDate(instance.date)}</time></td>
                    <td>${instance.location}</td>
                    <td class="data-table__action">
                        <a class="button button--small" data-course-date="${instance.date}" href="https://www.professional.ie/course_schedule/${filename}.html?id=${instance.id}">Book<span class="visually-hidden"> ${instance.name}, ${displayDate(instance.date)}, ${instance.location}</span></a>
                    </td>
                    </tr>`;
                break;
            case "metadata":
                let metadata = {
                    "@context":"https://schema.org",
                    "@type": "EducationEvent", 
                    name: `${ courseItem.name }`, 
                    image: site.logo, 
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
                        "url": "https://www.professional.ie/"
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
        return text.replace(/\r?\n/g, "<br>");
    })

    // template formats are set above with setTemplateFormats
    return {
        dir: {
            input: 'src',
            output: 'build',
            layouts: '_includes/layout'
        }
    };
};