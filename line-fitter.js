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
    var x_scale2 = d3.scale.linear().domain([0,chart_width]).range([xMin,xMax]);
    var y_scale2 = d3.scale.linear().domain([chart_height,0]).range([yMin,yMax]);
    
    var circ;
    
    
    //keeping track of data points
    var points = [];
    
    
////////////////////////////////// helper functions    

    function round_number(number,decimals){
        return Math.round(number*Math.pow(10,decimals))/Math.pow(10,decimals)
    }
    
/////////////////////////////////// set up div functions
    
    function Model() {
        var pointList = []; //array of [x,y] arrays
        var currentCoeffs = []; //[a,b] where a and b are from y = ax + b
        
        function add_point(point){ // add a point
            pointList.push(point);
        }
        function get_point_list(){
            return pointList;
        }
        function change_line(newCoeffs){ //change the coefficients of the best fit line
            currentCoeffs = newCoeffs;
        }
        function change_a(a){
            currentCoeffs[0] = a;
        }
        function change_b(b){
            currentCoeffs[1] = b;
        }
        function getCoeffs(){ //return the coefficients of the current best fit line
            return currentCoeffs;
        }
        
        //sums the difference between where the point is and where the point would be on the line
        function findErrors(){
            var totalError = 0;
            var totalSquareError = 0;
            var maxError = findError(pointList[0])
            var minError = findError(pointList[0])
            for(var i=0; i<pointList.length; i++){
                iError = findError(pointList[i]); //error at the ith point
                totalError += iError;
                totalSquareError += Math.pow(iError,2);
                if(Math.abs(maxError) < Math.abs(iError)){
                    maxError = iError;
                }
                if(Math.abs(minError) > Math.abs(iError)){
                    minError = iError;
                }
            }
            return {error: totalError, maxError: maxError, minError: minError, squareError: totalSquareError};
        }
        
        //finds the vertical error between a point and the line
        function findError(point){
            var error = point[1]-lineAt(point[0]);
            return error;
        }
    
        //returns the y value of the line at a point
        function lineAt(x){
            return (currentCoeffs[0]*x)+currentCoeffs[1];
        }
        
        function sumOfSquares(){
            var sumOfSquareError = 0;
            for(var i=0; i<pointList.length; i++){
                sumOfSquareError += Math.pow(findError(pointList[i]),2);
            }
            return sumOfSquareError;
        }
        
        function points_with_square_error(){
            var new_list = [];
            for(var i=0; i<pointList.length; i++){
                new_list.push([{y: Math.pow(findError(pointList[i]),2)}])
            }
            return new_list;
        }
        
        //finds the best fit for the points on the graph
        function bestFit(){
            var lineCoeffs; //coefficients of y=ax+b in the form [a,b]
            if(pointList.length <2){
                lineCoeffs = [0,0];
            }
            else if(pointList.length ==2){
                var x1 = pointList[0][0];
                var x2 = pointList[1][0];
                var y1 = pointList[0][1];
                var y2 = pointList[1][1];
                
                var a = (y2-y1)/(x2-x1);
                var b = y1 - a*x1;
                
                lineCoeffs = [a,b];
            }
            else{
                lineCoeffs = linear_regression(pointList);
            }
                
            return lineCoeffs;
        }
            //sums the errors of the points and returns optimized a and b for y = ax + b
        function linear_regression()
        {
            var i, x, y,
                sumx=0, sumy=0, sumx2=0, sumy2=0, sumxy=0,
                a, b;
            var count = pointList.length;
                
            for(i=0;i<pointList.length;i++)
            {   
                // this is our data pair
                x = pointList[i][0]; y = pointList[i][1]; 
        
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
        
        function get_variance(){
            var n = pointList.length;
            if(n ==0){
                return 0;
            }
            var sum = 0;
            for(var i =0; i<n; i++){
                sum += pointList[i][0];
            }
            var mean = sum/n;
            var variance = 0;
            for(var i =0; i<n; i++){
                variance += Math.pow(pointList[i][0]-mean,2);
            }
            return variance;
        }
        return {add_point: add_point, get_point_list: get_point_list, change_line: change_line, getCoeffs: getCoeffs, change_a: change_a, change_b: change_b, findErrors: findErrors, findError: findError, lineAt: lineAt, bestFit: bestFit, linear_regression: linear_regression, sumOfSquares: sumOfSquares, get_variance: get_variance, points_with_square_error: points_with_square_error};
    }
    
    function Controller(model) {
        function add_point_from_input(point){
            model.add_point(point);
        }
        function change_best_fit_line(){
            var coeffs = model.bestFit(model.get_point_list())
            model.change_line(coeffs);
        }

        return {add_point_from_input: add_point_from_input, change_best_fit_line: change_best_fit_line};
    }
    
    function View(div,model,controller) {    
        var color_scale = d3.scale.linear()
                .domain([0, yMax])
                .range(['#61A72D','#CC0000']);
        
        div.append("<div class='row-fluid hero-unit'><h2>Linear Regression</h2></div><div class='row-fluid well'><div class='span6 graph'></div><div class='span6 controls'></div></div>");
        $(".controls").append("<div class = 'row-fluid'><div class='container-fluid'><div class='row-fluid'><div class='span6'>a:<div class='a-slider'></div><div class='a-label'></div></div><div class='span6'>b:<div class='b-slider'></div><div class='b-label'></div></div></div><div class='row-fluid'><input type = 'checkBox' class = 'plot-fit'><span style = 'margin-left:5px;'>Plot Best-Fit</span><span class='equation' style = 'margin-left:10px'>y=ax+b</span></div>x: <input class='x-adder'> y: <input class='y-adder'><button class = 'add-point'>Add Point</button><br></br><div class='row-fluid'><div class='row-fluid'></div></div></div></div><div class = 'row-fluid'><table class = 'table table-striped data-table'></table></div>");
        //<button class='remove-line'>Remove Line</button>
        
        $(".graph").append("<div class='chart-container'></div><div class='info-container'></div><div class='graph-container'></div>");
        
        var tooltip = d3.select("body").append("div").attr("class","point-error").text("");

        var aSlider = $(".a-slider").slider({ min: -10, max: 10, step: .01, slide: function( event, ui ) {
            if ($('.plot-fit').prop('checked')==true){
                $('.plot-fit').attr('checked', false);
            }
            model.change_a(ui.value);
            displayLine(model.getCoeffs());
            $('.a-label').html(ui.value);
            displayErrorInfo()    
            turnErrorDisplayOff();
            turnErrorDisplayOn();
            graph()
            } 

        });
        var bSlider = $(".b-slider").slider({ min: -10, max: 10, step: .01,
            slide: function( event, ui ) {
                if ($('.plot-fit').prop('checked')==true){
                    $('.plot-fit').attr('checked', false);
                    }
                    model.change_b(ui.value);
                    displayLine(model.getCoeffs());
                    $('.b-label').html(ui.value);
                    displayErrorInfo()
                    turnErrorDisplayOff();
                    turnErrorDisplayOn();
            },
        });

//        aSlider.slider("disable");
//        bSlider.slider("disable");
        
        aSlider.slider('option','value',0);
        bSlider.slider('option','value',0);
        model.change_a(0);
        model.change_b(0);
        $('.b-label').html(0);
        $('.a-label').html(0);
        setupGraph();
        setupTable();
        displayLine([0,0]);

         //takes coefficients to y=ax+b and displays the corresponding on the graph
        function displayLine(coefficients){
            chart.selectAll(".best-fit").data(coefficients).remove();

            var y1 = coefficients[0]*xMin+coefficients[1];
            var y2 = coefficients[0]*xMax+coefficients[1];
            
            chart.selectAll(".best-fit").data(coefficients).enter().append("line").attr("class", "best-fit").attr('x1', x_scale(xMin)).attr('x2', x_scale(xMax)).attr('y1', y_scale(y1)).attr('y2',y_scale(y2));
            
            updateTable();
            
            if(model.get_point_list().length > 0){
                turnErrorDisplayOn();
            }
        }
        //adds a circular point of radius 2px at coordinates (x,y) to the svg canvas
        function addPointToGraph(x,y){
            chart.selectAll(".endpoint").data([0]).enter().append("circle")
                .attr("class", "datapoint")
                .attr("cx", x_scale(x))
                .attr("cy", y_scale(y))
                .on("mouseover", function(){
                    return tooltip.html("Error: "+Math.round(model.findError([x,y])*1000)/1000+" "+" Squared Error: "+Math.round(Math.pow(model.findError([x,y]),2)*1000)/1000).style("visibility", "visible");
                    
                    // if ($('.plot-fit').prop('checked') == true){
                    //     return tooltip.html("Error: "+model.findError([x,y])+" "+" Squared Error: "+Math.pow(model.findError([x,y]),2)).style("visibility", "visible");
                    // }
                    // else{
                    //     return tooltip.html("Check the Plot Best-Fit box to view the error").style("visibility", "visible");
                    // }
                })
                .on("mousemove", function(){
                    return tooltip.style("top",(d3.event.pageY+10)+"px").style("left",(d3.event.pageX+10)+"px");
                })
                .on("mouseout",function(){
                    return tooltip.style("visibility", "hidden");
                })
                .style("fill","blue")
                .call(move)
                .attr("r", "4");
            model.add_point([x,y]);
            updateTable();
            turnErrorDisplayOff();
            turnErrorDisplayOn();
        }
        
        //shows the total error and sum of squares error
        function displayErrorInfo(){
            $(".info-container").empty();
            $(".info-container").append("<div class='row-fluid error' rel='popover' data-content=''></div><div class='row-fluid squared'></div>");
            $(".error").html("Total error: " + round_number(model.findErrors().error,2));
            $(".squared").html("Total squared error: " +round_number(model.findErrors().squareError,2));
            

        }

        function removeErrorInfo(){
            $(".info-container").empty();
            $(".error").popover('disable');
            $(".squared").popover('disable');
        }
            
        //adds vertical bars from point to best-fit line (with color scale that displays how much error)
        function turnErrorDisplayOn(){
        
            chart.selectAll(".error-line").data(model.get_point_list()).enter().append("line").attr("class", "error-line").attr('x1', function(d){return x_scale(d[0])}).attr('x2', function(d){ return x_scale(d[0])}).attr('y1', function(d){ return y_scale(d[1])}).attr('y2',function(d){ return y_scale(model.lineAt(d[0]))}).style("stroke", function(d) {return color_scale(model.findError(d)); });
            
            displayErrorInfo()
            
                                    
            $(".error").popover({trigger: 'hover', title: "Error Value", content: makeErrorString(color_scale), html: true});
            $(".squared").popover({trigger: 'hover', title: "Sum of Squares Value", content: makeErrorSquareString(color_scale).unsolved + "<br>=</br>" + makeErrorSquareString(color_scale).solved, html: true});
        }

        var move =  d3.behavior.drag()
                    .on("drag",drag)
                    .on("dragend",function(){
                    var dragPoint = d3.select(this);
                    var newX = x_scale2(parseInt(dragPoint.attr("cx")));
                    var newY = y_scale2(parseInt(dragPoint.attr("cy")));
                    addPointToGraph(newX,newY);
                    console.log(model.get_point_list());
                    displayLine(model.bestFit());
                
                });

            function drag(){
                var dragPoint = d3.select(this);
                dragPoint
                .attr("cx",function(){return d3.event.dx + parseInt(dragPoint.attr("cx"));})
                .attr("cy",function(){return d3.event.dy +parseInt(dragPoint.attr("cy"));})
                
        }


        
        //returns a string that shows how the error was calculated by color
        function makeErrorString(color_scale){
            var points = model.get_point_list();
            var errorArray = [];
            for(var i = 0; i<points.length; i++){
                errorArray.push("<span style='color:" + color_scale(model.findError(points[i])) + ";'>(" + Math.round(model.findError(points[i])*100)/100 + ")</span>");
            }
            var errorString = errorArray.join("+");
            return errorString;
        }   
        
        //returns a string that shows how the sum of squares error was calculated by color
        function makeErrorSquareString(color_scale){
            var points = model.get_point_list();
            var errorArrayOne = [];
            var errorArrayTwo = [];
            for(var i = 0; i<points.length; i++){
                errorArrayOne.push("<span style='color:" + color_scale(model.findError(points[i])) + ";'>(" + Math.round(model.findError(points[i])*100)/100 + ")<sup>2</sup></span>");
                errorArrayTwo.push("<span style='color:" + color_scale(model.findError(points[i])) + ";'>(" + Math.round(Math.pow(model.findError(points[i]), 2)*100)/100 + ")</span>");
            }
            var errorStringOne = errorArrayOne.join("+");
            var errorStringTwo = errorArrayTwo.join("+");
            return {unsolved: errorStringOne, solved: errorStringTwo};
        }
        
        //removes vertical bars from point to best-fit line
        function turnErrorDisplayOff(){
            chart.selectAll(".error-line").data(model.get_point_list()).remove();
            removeErrorInfo()
        }
        
        //initializes a table with headers
        function setupTable(){
            $('.data-table').append("<thead><tr><th>Observed x</th><th>Observed y</th><th>Predicted y</th><th>Error</th><th>Squared Error</th></tr></thead>");
        }
        
        //adds point data to each row of table
        function updateTable(){
            clearTable()
            var points = model.get_point_list();
            for(var i = 0; i<points.length; i++){
                $('.data-table').append("<tr><td contenteditable class='x-display' id='"+i+"'>"+points[i][0]+"</td><td contenteditable class='y-display' id='"+i+"'>"+points[i][1]+"</td><td>"+round_number(model.lineAt(points[i][0]),2)+"</td><td>"+round_number(model.findError(points[i]),2)+"</td><td>"+round_number(Math.pow(model.findError(points[i]),2),2)+"</td></tr>");
            }
            
            var contents = $('.x-display').html();
            $('.x-display').blur(function() {
                if (contents!=$(this).html()){
                    alert($(this).html());
                    //controller.change_point($(this).attr("id"), );
                    contents = $(this).html();
                }
            });
            
             $('.data-table').append("<tr><th>Total:</th><td></td><td></td><td></td><th>"+round_number(model.sumOfSquares(),2)+"</th></tr>");
        }

        function clearTable(){
            $(".data-table").find("tr:gt(0)").remove();
        }
        function graph(){
            $(".graph-container").empty();
            var maxValue = model.get_variance()*5;
            var title = "Sum of Squares";
            var data = model.points_with_square_error();
            
            var graph_outer_width = parseInt($(".graph").css("width"))-38;
            var graph_outer_height = 300;
            var graph_margin = { top: graph_outer_width/8, right: graph_outer_width/8, bottom: graph_outer_width/8, left: graph_outer_width/8 }
            var graph_chart_width = graph_outer_width - graph_margin.left - graph_margin.right;
            var graph_chart_height = graph_outer_height -graph_margin.top - graph_margin.bottom;
                    
            var graph_y_scale = d3.scale.linear().domain([0,maxValue]).range([graph_chart_height,0]);
            
            var graph_chart = d3.select(".graph-container").append("svg").attr("class","graph").attr("height", graph_outer_height).attr("width",graph_outer_width).append("g").attr("transform","translate(" + (graph_margin.left+graph_margin.right) + "," + (graph_margin.top + graph_margin.bottom -5)+ ")");
                
            graph_chart.selectAll(".y-scale-label").data(graph_y_scale.ticks(4)).enter().append("text").attr("class", "y-scale-label").attr("x",graph_margin.left/2).attr('y',graph_y_scale).attr("text-anchor","end").attr("dy","0.3em").attr("dx",-graph_margin.left/2).text(function(d){return d});
            
            graph_chart.selectAll(".chart-title").data([1]).enter().append("text").attr("class", "chart-title").attr("x",-10).attr('y',-10).text(title);
            
            if(data.length>0){
                var stack = d3.layout.stack();
                var stacked_data = stack(data);
                console.log(stacked_data)
                var layer_groups = graph_chart.selectAll(".layer").data(stacked_data).enter().append("g").attr("class", "layer");
                
                var rects = layer_groups.selectAll('rect').data(function(d){return d}).enter().append('rect').attr("x",0).style("fill", function(d, i, j) { return color_scale(j);}).attr("height", 0).attr("y", function(d){return graph_y_scale(d.y0)}).transition().duration(500).delay(function(d,i,j){return j*450}).attr("y", function(d){return graph_y_scale(d.y0+d.y)}).attr("width", graph_chart_width).attr("height", function(d){ return graph_y_scale(d.y0) - graph_y_scale(d.y0+d.y); });
            }
            

      }
        //functionality to the buttons
        $('.add-point').on("click",function(){

            point = [parseFloat($('.x-adder').val()),parseFloat($('.y-adder').val())]
            addPointToGraph(point[0],point[1]);
            if ($('.plot-fit').prop('checked')==true){
                controller.change_best_fit_line();
                displayLine(model.bestFit());
            }
            turnErrorDisplayOff();
            turnErrorDisplayOn();
            
        });
        
        $('.plot-fit').on("click",function(){
            controller.change_best_fit_line();
            var coefficients = model.getCoeffs();
            displayLine(coefficients);
            aSlider.slider("enable");
            aSlider.slider("option","value",coefficients[0]);
            $('.a-label').html(Math.round(coefficients[0]*100)/100);
            bSlider.slider("enable");
            bSlider.slider("option","value",coefficients[1]);
            $('.b-label').html(Math.round(coefficients[0]*100)/100);
            $('.equation').html("y="+Math.round(coefficients[0]*100)/100+"x+("+Math.round(coefficients[0]*100)/100+")");
            displayErrorInfo();
            turnErrorDisplayOff();
            turnErrorDisplayOn();

        });
        
//        $('.remove-line').on("click",function(){
//            $('.plot-fit').attr('checked',false);
//            $('.best-fit').remove();
//            
//            $('.toggle-error').attr('checked',false);
//            turnErrorDisplayOff();
//            
//            aSlider.slider("disable");
//            bSlider.slider("disable");
//            
//            clearTable();
//        });
//
//        $('.toggle-error').on("click",function(){
//            if($(".best-fit").length > 0){ //if there is a line, toggle errors
//                if($(this).prop("checked")==true){
//                    turnErrorDisplayOn();
//                }
//                else{
//                    turnErrorDisplayOff();
//                }
//            }
//            else{ //otherwise, don't let the user click this
//                $(this).attr("checked",false);
//            }
//        });
        
        return {displayLine: displayLine, addPointToGraph: addPointToGraph};
    }
    
    //set up svg with axes and labels
    function setupGraph(){

        chart = d3.select(".chart-container").append("svg").attr("class","chart").attr("height", outer_height).attr("width",outer_width).append("g").attr("transform","translate(" + margin.left + "," + margin.top + ")")//.on("mousemove", function() { move(d3.mouse(this)); }).on("click",function(){click(d3.mouse(this))});
        
//        function move(p2) {
//            }
//        function click(p2){
//            chart.append("circle")
//                .attr("cy",p2[1])
//                .attr("cx",p2[0])
//                .attr("fill","black")
//                .attr("r","2");
//            console.log(p2[0]-margin.left,p2[1]-margin.top);
//            model.add_point([p2[0],p2[1]]);
//        }
        chart.selectAll(".y-line").data(y_scale.ticks(10)).enter().append("line").attr("class", "y-line").attr('x1', 0).attr('x2', chart_width).attr('y1', y_scale).attr('y2',y_scale);
        
        chart.selectAll(".x-line").data(x_scale.ticks(10)).enter().append("line").attr("class", "x-line").attr('x1', x_scale).attr('x2', x_scale).attr('y1', 0).attr('y2',chart_height);
    
        chart.selectAll(".y-scale-label").data(y_scale.ticks(10)).enter().append("text").attr("class", "y-scale-label").attr("x",x_scale(0)).attr('y',y_scale).attr("text-anchor","end").attr("dy","0.3em").attr("dx","0.5em").text(String);
        
        chart.selectAll(".x-scale-label").data(x_scale.ticks(10)).enter().append("text").attr("class", "x-scale-label").attr("x",x_scale).attr('y',y_scale(0)).attr("text-anchor","end").attr("dy","0.3em").attr("dx","0.5em").text(String);

    }
    
    //setup main structure of app
    function setup(div) {

        var model = Model();
        var controller = Controller(model);
        var view = View(div, model, controller);
        
        var points = [[4,4],[1,1],[2,1],[-3,6]];
        for(var i =0; i<points.length; i++){
            view.addPointToGraph(points[i][0],points[i][1]);
        }
    }; 
    
    exports.setup = setup;
    exports.round_number = round_number;

    return exports;
}());

$(document).ready(function() {
    lineFit.setup($('.line-fit'));
});