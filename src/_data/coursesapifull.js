
const Cache = require("@11ty/eleventy-fetch");
const fs = require('fs');


//const site = JSON.parse(json);

module.exports = async function() {

  let rawData = fs.readFileSync(`${__dirname}/site.json`);
  let site = JSON.parse(rawData);

  //let url = `https://professional.ie/api/getCoursesForKeywordsFull.php?keywords[]=${site.searchKeywords.join("&keywords[]=")}`;
  let url = `http://professional.ie/api/getCoursesForKeywordsFull.php?keywords[]=${site.searchKeywords.join("&keywords[]=")}`;

  console.log(url);

  let json = await Cache(url, {
    duration: "1m", 
    type: "json"
  });


  distinctCourseList = json.flatMap(keyword => keyword.courses)
                           .filter((course, index, courses) => courses.findIndex(c=>c.id==course.id) == index);

  let distinctMicrositeKeywordList = json.flatMap(keyword=> keyword.microsite_keywords)
                          .filter((mskeyword, index, list) => list.indexOf(mskeyword) == index)
                          .filter((mskeyword)=>mskeyword != "");

  distinctMicrositeKeywordList = distinctMicrositeKeywordList.reduce((result, item) => {
      // do a case-insensitive compare to 
      // see if item is alreay in the result array
      if (result.findIndex(resultItem => {
          return resultItem.toLowerCase() == item.toLowerCase();
      }) == -1) {
          result.push(item);
      }
      return result;
  }, []);




  let schedule = json.flatMap(keyword => keyword.schedule).filter(instance => instance.course_id != null);

  schedule = schedule.map(instance => {
    return {
        ...instance, 
        courseDate:new Date(instance.date), 
        //details: distinctCourseList.find(course=>course.id == instance.course_id) 
    }
  }).sort((i1, i2) => {
    return new Date(i1.date) - new Date(i2.date);
  });


  let distinctCourseListWithSchedule = distinctCourseList.map(course => {
    return {
        ...course, 
        schedule: schedule.filter(instance => {
            return instance.course_id == course.id;
        })
    }
  });

  // courses in the course groups named in site.json "featuredGroups" go first on the
  // Courses and Schedule pages, group by group in that order; everything else keeps
  // the API's order (as does each course within its group)
  let normalise = text => String(text || "").replace(/&amp;/g, "&").trim().toLowerCase();
  let featuredGroups = (site.featuredGroups || []).map(normalise);
  let featuredRank = course => {
    let rank = featuredGroups.indexOf(normalise(course.group));
    return rank == -1 ? featuredGroups.length : rank;
  };
  featuredGroups.forEach((group, i) => {
    if (!distinctCourseListWithSchedule.some(course => featuredRank(course) == i)) {
      console.warn(`[featuredGroups] no courses in a group called "${site.featuredGroups[i]}" - check the name in site.json`);
    }
  });
  let coursesFeaturedFirst = distinctCourseListWithSchedule
    .map((course, index) => ({ course, index }))
    .sort((a, b) => featuredRank(a.course) - featuredRank(b.course) || a.index - b.index)
    .map(item => item.course);

  url = `http://professional.ie/api/getLandingPageTextForKeywords.php?keywords[]=${distinctMicrositeKeywordList.join("&keywords[]=")}`;

  console.log(url);

  json = await Cache(url, {
    duration: "1m", 
    type: "json"
  });


  // the API can return the same keyword more than once, which creates duplicate pages
  json = json.filter((keyword, index, list) =>
    list.findIndex(k => k.keyword.toLowerCase() == keyword.keyword.toLowerCase()) == index);

  let msKeywordData = json.map(keyword=> {
   
    //console.log(keyword);
    return {
      keyword: keyword.keyword, 
      paragraphs: keyword.paragraphs, 
      courses: distinctCourseListWithSchedule.filter(course=>course.searchWords.includes(keyword.keyword)), 
    }
  });

  
  // change the order of the keywords to put the primary keyword first
  let index = msKeywordData.findIndex(keyword => keyword.keyword == site.searchKeywords[0]);

  // bugfix, if keyword not found don't do anything 
  if (index != -1) {

    let primaryKeyword = msKeywordData[index];
    msKeywordData.splice(index, 1);
    msKeywordData.unshift(primaryKeyword);
  }

    //let savedSearches = site.searchLocations.flatMap(location=> msKeywordData.map(keyword => {
    let savedSearches = msKeywordData    
        .flatMap(keyword=> {
      return site.searchLocations.map(location => {

        return {
          keyword: `${keyword.keyword} Training`, 
          location, 
          title: `${keyword.keyword} Training Courses ${location}`, 
          courses: keyword.courses, 
          paragraphs: keyword.paragraphs
        }
      });
    
  });

  return {
    courses: coursesFeaturedFirst,
    micrositeKeywords: json,
    relatedKeywords: distinctMicrositeKeywordList,
    msKeywordData, 
    savedSearches, 
    schedule
  };
};