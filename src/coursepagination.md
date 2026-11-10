---
layout: course_layout
pagination:
    data: coursesapifull.courses
    size: 1
    alias: course
permalink: "courses/{{ course.name | slug | removeInvalidChars}}/"
pageType: course
---
{{ courseapi | json }}
