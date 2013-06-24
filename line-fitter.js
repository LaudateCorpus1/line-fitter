var lineFit = (function() {
    
    var exports = {};
    
////////////////////////////////// global variables 
    
    //d3 chart components
    var chart;
    
    var outer_height = 300;
    var outer_width = 300;

    var margin = { top: 20, right: 20, bottom: 20, left: 20 }
    var chart_width = outer_width - margin.left - margin.right;
    var chart_height = outer_height -margin.top - margin.bottom;
    
    var x_scale = d3.scale.linear().domain([-10,10]).range([0,chart_width]);
    var y_scale = d3.scale.linear().domain([-10,10]).range([chart_height,0]);
    
    //keeping track of data points
    var points = [];
    
////////////////////////////////// helper functions    

    
/////////////////////////////////// set up div functions
    
    function Model() {
        return {};
    }
    
    function Controller(model) {
        return {};
    }
    
    function View(div,model,controller) {       
    
        return {};
    }
    
    //set up svg with axes and labels
    function setupGraph(){
        chart = d3.select(".chart-container").append("svg").attr("class","chart").attr("height", outer_height).attr("width",outer_width).append("g").attr("transform","translate(" + margin.left + "," + margin.top + ")");
        
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
        b = (sumy*sumx2 - sumx*sumxy)/(count*sumx2-sumx*sumx);
        a = (count*sumxy - sumx*sumy)/(count*sumx2-sumx*sumx);
        
        return [a,b];
    }
    
    function displayLine(){
        var lineCoeffs = bestFit();
        
    }
        
    //setup main structure of app
    function setup(div) {
        div.append("<div class='chart-container'></div>");
        
        setupGraph();
        
        var model = Model();
        var controller = Controller(model);
        var view = View(div, model, controller);
        
        
    }; 
    
    exports.setup = setup;
    
    return exports;
}());

$(document).ready(function() {
    lineFit.setup($('.line-fit'));
});