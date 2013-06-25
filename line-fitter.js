var lineFit = (function() {
    
    var exports = {};
    
////////////////////////////////// global variables 
    
    //d3 chart components
    var chart;
    
    var xMin = -10;
    var xMax = 10;
    var yMin = -10;
    var yMax = 10;
    
    var outer_height = 300;
    var outer_width = 300;

    var margin = { top: 20, right: 20, bottom: 20, left: 20 }
    var chart_width = outer_width - margin.left - margin.right;
    var chart_height = outer_height -margin.top - margin.bottom;
    
    var x_scale = d3.scale.linear().domain([xMin,xMax]).range([0,chart_width]);
    var y_scale = d3.scale.linear().domain([yMin,yMax]).range([chart_height,0]);
    
    var circ;
    
    
    //keeping track of data points
    var points = [];
    
////////////////////////////////// helper functions    

/////////////////////////////////// set up div functions
    
    function Model() {
        var pointList = []; //array of [x,y] arrays
        var bestFitCoeffs = []; //[a,b] where a and b are from y = ax + b
        
        function add_point(){ // add a point
        }
        function change_line(){ //change the coefficients of the best fit line
        }
        return {add_point: add_point, change_line: change_line};
    }
    
    function Controller(model) {
        
        function add_points_from_file(file){
        }
        function add_point_from_input(){
        }
        function change_best_fit_line(){
        }
        return {};
    }
    
    function View(div,model,controller) {       
        div.append("<div class='row-fluid well'><h2>Line-Fitting</h2></div><div class='row-fluid'><div class='span6 graph well'></div><div class='span6 controls well'></div></div>");
        $(".controls").append("<div class='container-fluid'>x: <input class='x-adder'> y: <input class='y-adder'><button class = 'add-point'>Add Point</button><br></br><div class='row-fluid'><button class = 'plot-fit'>Plot Best-Fit</button><br></br><div class='row-fluid'><button class = 'toggle-error'>Toggle Error Display</button><br></br><div class='a-slider'></div><br></br><div class='b-slider'></div></div></div>");
        $(".graph").append("<div class='container-fluid'><div class='chart-container'></div></div>");
        $(".a-slider").slider();
        $(".b-slider").slider();
        
        return {};
    }
    
    //set up svg with axes and labels
    function setupGraph(){
        chart = d3.select(".chart-container").append("svg").attr("class","chart").attr("height", outer_height).attr("width",outer_width).append("g").attr("transform","translate(" + margin.left + "," + margin.top + ")").on("mousemove", function() { move(d3.mouse(this)); }).on("click",function(){click(d3.mouse(this))});
        
        function move(p2) {
            }
        function click(p2){
            chart.append("circle")
                .attr("cy",p2[1])
                .attr("cx",p2[0])
                .attr("fill","black")
                .attr("r","2");
            console.log(p2[0]-margin.left,p2[1]-margin.top);
            points.push([p2[0],p2[1]]);
        }
        chart.selectAll(".y-line").data(y_scale.ticks(10)).enter().append("line").attr("class", "y-line").attr('x1', 0).attr('x2', chart_width).attr('y1', y_scale).attr('y2',y_scale);
        
        chart.selectAll(".x-line").data(x_scale.ticks(10)).enter().append("line").attr("class", "x-line").attr('x1', x_scale).attr('x2', x_scale).attr('y1', 0).attr('y2',chart_height);
    
        chart.selectAll(".y-scale-label").data(y_scale.ticks(10)).enter().append("text").attr("class", "y-scale-label").attr("x",x_scale(0)).attr('y',y_scale).attr("text-anchor","end").attr("dy","0.3em").attr("dx","0.5em").text(String);
        
        chart.selectAll(".x-scale-label").data(x_scale.ticks(10)).enter().append("text").attr("class", "x-scale-label").attr("x",x_scale).attr('y',y_scale(0)).attr("text-anchor","end").attr("dy","0.3em").attr("dx","0.5em").text(String);

    }
        
    
    //adds a circular point of radius 2px at coordinates (x,y) to the svg canvas
    function addPoint(x,y){
        chart.selectAll(".datapoint").data([0]).enter().append("circle")
            .attr("class", "endpoint")
            .attr("cx", x_scale(x))
            .attr("cy", y_scale(y))
            .attr("r", "2");
        points.push([x,y]);
    }
    
    //finds the best fit for the points on the graph
    function bestFit(){
        var lineCoeffs; //coefficients of y=ax+b in the form [a,b]
        if(points.length <2){
            lineCoeffs = [0,0];
        }
        else if(points.length ==2){
            var x1 = points[0][0];
            var x2 = points[1][0];
            var y1 = points[0][1];
            var y2 = points[1][1];
            
            var a = (y2-y1)/(x2-x1);
            var b = y1 - a*x1;
            
            lineCoeffs = [a,b];
        }
        else{
            lineCoeffs = linear_regression();
        }
            
        return lineCoeffs;
    }
    
    //sums the errors of the points and returns optimized a and b for y = ax + b
    function linear_regression()
    {
        var i, x, y,
            sumx=0, sumy=0, sumx2=0, sumy2=0, sumxy=0,
            a, b;
        var count = points.length;
            
        for(i=0;i<points.length;i++)
        {   
            // this is our data pair
            x = points[i][0]; y = points[i][1]; 
    
            sumx += x;
            sumx2 += (x*x);
            sumy += y;
            sumy2 += (y*y);
            sumxy += (x*y);
        }
    
        // note: the denominator is the variance of the random variable X
        // the only case when it is 0 is the degenerate case X==constant
        var b = (sumy*sumx2 - sumx*sumxy)/(count*sumx2-sumx*sumx);
        var a = (count*sumxy - sumx*sumy)/(count*sumx2-sumx*sumx);
        
        return [a,b];
    }
    
    //takes coefficients to y=ax+b and displays the corresponding on the graph
    function displayLine(coeffs){
        chart.selectAll(".best-fit").data(coeffs).remove();
        var lineCoeffs = coeffs; //bestFit();
        var y1 = lineCoeffs[0]*xMin+lineCoeffs[1];
        var y2 = lineCoeffs[0]*xMax+lineCoeffs[1];
        
        chart.selectAll(".best-fit").data(coeffs).enter().append("line").attr("class", "best-fit").attr('x1', x_scale(xMin)).attr('x2', x_scale(xMax)).attr('y1', y_scale(y1)).attr('y2',y_scale(y2));
    }
    
    //adds vertical bars from point to best-fit line (with color scale that displays how much error)
    function turnErrorDisplayOn(){
    }
    
    //removes vertical bars from point to best-fit line
    function turnErrorDisplayOff(){
    }
        
    //setup main structure of app
    function setup(div) {
        setupGraph();
        
        var model = Model();
        var controller = Controller(model);
        var view = View(div, model, controller);
        

        $('.add-point').on("click",function(){
            addPoint(parseFloat($('.x-adder').val()),parseFloat($('.y-adder').val()));
        });
        
        $('.plot-fit').on("click",function(){
            displayLine(bestFit());
        });
        
        $('.toggle-error').on("click",function(){
            $(this).toggleClass("selected");
            if($(this).hasClass("selected")){
                turnErrorDisplayOn();
            }
            else{
                turnErrorDisplayOff();
            }
        });
        
        
    }; 
    
    exports.setup = setup;
    exports.displayLine = displayLine;
    
    return exports;
}());

$(document).ready(function() {
    lineFit.setup($('.line-fit'));
});