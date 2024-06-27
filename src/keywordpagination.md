---
layout: general_layout
pagination:
    data: coursesapifull.relatedKeywords
    size: 1
    alias: keyword
permalink: "training_courses/{{ keyword | slug | removeInvalidChars }}/"
page:
    type: keyword
    title: Training Courses
---
# {{ keyword }} Training Courses


<hr class="my-2">
<table class="table">
<thead>
    <tr>
       <th>Name</th><th>Description</th>
    </tr> 
</thead>
<tbody>
</tbody>

{% for course in coursesapifull.courses %}

    {% assign value = keyword | append: "," %}
    {% if course.searchWords contains value %}
<tr>
<td><a href="/courses/{{ course.name | slug }}/">{{ course.name }}</a></td>
<td>{{ course.descrip}}</td>
</tr>
    {% endif %}
{% endfor %} 
</tbody>
</table>


