---
layout: base_layout
pagination:
    data: coursesapifull.relatedKeywords
    size: 1
    alias: keyword
permalink: "training_courses/{{ keyword | replace: '#', ' sharp' | replace: '+', ' plus' | slug | removeInvalidChars }}/"
pageType: keyword
---
<header class="page-head">
<div class="wrap">
<p class="breadcrumb"><a href="/courses/">Courses</a></p>
<h1>{{ keyword }} training courses</h1>
<p class="page-head__lead">Instructor-led {{ keyword }} courses in Dublin, Cork, Limerick and live online.</p>
</div>
</header>

<div class="wrap page">
{% assign value = keyword | append: "," %}
{% assign found = 0 %}
<ul class="course-list">
{% for course in coursesapifull.courses %}{% if course.searchWords contains value %}{% assign found = found | plus: 1 %}
<li>
<h2><a href="/courses/{{ course.name | slug | removeInvalidChars }}/">{{ course.name }}</a></h2>
<p>{{ course.descrip | truncate: 220 }}</p>
{% assign meta = course | courseMeta %}{% if meta != "" %}<p class="course-list__meta">{{ meta }}</p>{% endif %}
</li>
{% endif %}{% endfor %}
</ul>
{% if found == 0 %}
<p>No scheduled {{ keyword }} courses are listed right now. See <a href="/courses/">all courses</a> or <a href="#contact">contact us</a> about training for your team.</p>
{% endif %}
</div>
