---
layout: general_layout
pagination:
    data: test.keywords
    size: 1
    alias: course
permalink: "test/{{ course.title | slug | removeInvalidChars}}/"
page:
    type: other
    title: "other title {{ course.title }}"
---
{{ test.keywords | json }}
