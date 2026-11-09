---
layout: base_layout
title: Courses
metaTitle: All AI Training Courses | Dublin Cork Limerick Ireland
description: Every AI training course we run, with outlines and dates. Instructor-led courses in Dublin, Cork, Limerick and live online.
tags: [main]
page:
    type: courses
---
<header class="page-head">
<div class="wrap">
<h1>{% for keyword in site.searchKeywords %}{{ keyword }} {% endfor %}training courses</h1>
<p class="page-head__lead">Instructor-led courses in Dublin, Cork, Limerick and live online. Choose a course to see what it covers and when it runs.</p>
</div>
</header>

<div class="wrap page">
<ul class="course-list">
{% for course in coursesapifull.courses %}
<li>
<h2><a href="/courses/{{ course.name | slug | removeInvalidChars }}/">{{ course.name }}</a></h2>
<p>{{ course.descrip | truncate: 220 }}</p>
<p class="course-list__meta">{{ course.durationDays }} {% if course.durationDays == 1 %}day{% else %}days{% endif %}{% assign next = course.schedule | nextDate %}{% if next != "" %}, next date {{ next | displayDate }}{% endif %}</p>
</li>
{% endfor %}
</ul>
</div>
