Line-Fitter Applet
===========

Developed by Laura Breiman (<lauracle@mit.edu>) and Samarth Mohan (<smohan94@mit.edu>)
Mentor: Fredo Durand (fredopdurand@gmail.com)
===========

General Description: this applet helps students visualize the process of finding a line of best-fit by interactively minimizing the sum of least squares. For use in the MIT class 6.00 (Introduction to Computer Science and Programming) to understand least-squares algorithms.

Uses: Bootstrap, Javascript, CSS, jQuery, jQueryUI, d3

To view the demo:

http://htmlpreview.github.com/?https://github.com/laurabreiman/line-fitter/blob/master/line-fitter.html

=======

To insert the applet in your own web page, add the following HTML code to the head of your own code, and insert a div with class "line-fit" in the body of your html (<div class="line-fit"></div>) :

        <script src ="example-data.js"></script>
        <script src ="work-data.js"></script>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.10.1/jquery.min.js"></script>
        <script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min.js"></script>
        <script src="bootstrap/js/bootstrap.min.js"></script>
        <script src="http://d3js.org/d3.v3.min.js" charset="utf-8"></script>
        <link href="bootstrap/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="font-awesome/css/font-awesome.min.css">
        <link href="line-fitter.css" rel="stylesheet">
        <link rel="stylesheet" href="http://code.jquery.com/ui/1.10.3/themes/smoothness/jquery-ui.css" />
        <script src="line-fitter.js"></script>