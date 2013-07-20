
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
    var dict = [];
    var oldX_1;
    var oldY;
    var index;
    var uX;
    
////////////////////////////////// helper functions    
    
    //rounds a number (number) to the specified amount of decimal points (decimals)
    function round_number(number,decimals){
        return Math.round(number*Math.pow(10,decimals))/Math.pow(10,decimals)
    }
    
    //creates a range of values from start to stop in step sized increments
    function range(start, stop, step){
    if (typeof stop=='undefined'){
        // one param defined
        stop = start;
        start = 0;
    };
    if (typeof step=='undefined'){
        step = 1;
    };
    if ((step>0 && start>=stop) || (step<0 && start<=stop)){
        return [];
    };
    var result = [];
    for (var i=start; step>0 ? i<stop : i>stop; i+=step){
        result.push(i);
    };
    return result;
};
/////////////////////////////////// set up div functions
    
    /* Model that contains instance variables:
        pointList - points to be fitted, one array of many [x,y] arrays
        currentCoeffs - [a,b] of y = ax + b
        currentQuadCoeffs - [a,b,c] of y = ax^2 + bx + c
        
        functions:
        add_point - adds a point to pointList
        replace_point - takes an index and new x and y coordinates and replaces the point at the index with the new coordinates
        clear_points - empties the pointList
        getIndexOf - takes x and y coordinates and gets the index of the point in the pointList
        get_point_list - returns the pointList
        change_line - takes new coefficients to change currentCoeffs to
        change_a - changes the first entry in currentCoeffs to the input
        change_b - changes the second entry in currentCoeffs to the input
        change_c - changes the third entry in currentQuadCoeffs to the input
        get_a - returns the a value
        get_b - returns the b value
        get_c - returns the c value
        getCoeffs - return current line coefficients
        getQuadCoeffs - return current quadratic coefficients
        randomize_points - generate a number of random points to add to pointList
        make_random_point - makes a random point between xMax,xMin and yMax,yMin
        findError - returns the error between a point and the line 
    */
    function Model() {
        var pointList = []; //array of [x,y] arrays
        var currentCoeffs = [0,0]; //[a,b] where a and b are from y = ax + b
        var currentQuadCoeffs = [0,0,0]; //[a,b,c] from y = ax^2+bx+c
        
        function add_point(point){ // add a point
            pointList.push([point[0],point[1]]);
        }

        function replace_point(index,x,y){
            delete pointList[index];
            pointList[index] = [x,y];
        }
        
        function clear_points(){
            pointList = [];
        }
        
        function getIndexOf(x,y){
            for (var i = 0; i < pointList.length; i++) {
                if(pointList[i][0] == x && pointList[i][1] == y)
                    return i;
            };

            return -1;
        };
        
        function get_point_list(){
            return pointList;
        }
        function change_line(newCoeffs){ //change the coefficients of the best fit line
            currentCoeffs = newCoeffs;
        }
        function change_a(a){
            currentCoeffs[0] = a;
            currentQuadCoeffs[0] = a;
        }
        function change_b(b){
            currentCoeffs[1] = b;
            currentQuadCoeffs[1] = b;
        }
        function change_c(c){
            currentQuadCoeffs[2] = c;
        }
        function get_a(){
            return currentCoeffs[0];
        }
        function get_b(){
            return currentCoeffs[1];
        }
        function get_c(){
            return currentQuadCoeffs[2];
        }
        function getCoeffs(){ //return the coefficients of the current best fit line
            return currentCoeffs;
        }
        
        function getQuadCoeffs(){
            return currentQuadCoeffs;
        }
        
        function randomize_points(number){
            pointList = [];
            yMin = -10;
            yMax = 10;
            xMax = 10;
            xMin = -10;
            for(var i=0; i<number; i++){
                pointList.push(make_random_point());
            }
            return pointList;
        }
        
        function make_random_point(){
            var x = Math.random()*xMax;
            var isNeg = Math.random();
            if(isNeg>0.5){
                x = (-1)*x;
            }
            var y = Math.random()*yMax;
            isNeg = Math.random();
            if(isNeg>0.5){
                y = (-1)*y;
            }
            return [round_number(x,2),round_number(y,2)]
        }
        
        //finds the vertical error between a point and the line
        function findError(point){
            var error = point[1]-lineAt(point[0]);
            return error;
        }
        
        //finds the vertical error between a point and the quadratic
        function findQuadError(point){
            var error = point[1]-quadAt(point[0]);
            return error;
        }
    
        //returns the y value of the line at a point
        function lineAt(x){
            return (currentCoeffs[0]*x)+currentCoeffs[1];
        }

        //returns the y value of the quadratic at a point
        function quadAt(x){
            return (currentQuadCoeffs[0]*x*x)+currentQuadCoeffs[1]*x+currentQuadCoeffs[2];
        }
        
        //sums the squared vertical error from each point to the line
        function sumOfSquares(){
            var sumOfSquareError = 0;
            for(var i=0; i<pointList.length; i++){
                sumOfSquareError += Math.pow(findError(pointList[i]),2);
            }
            return sumOfSquareError;
        }
        
        //sums the squared vertical error from each point to the quadratic 
        function sumOfQuadSquares(){
            var sumOfSquareError = 0;
            for(var i=0; i<pointList.length; i++){
                sumOfSquareError += Math.pow(findQuadError(pointList[i]),2);
            }
            return sumOfSquareError;
        }
        
        //returns the array of points and their squared error
        function points_with_square_error(isQuadratic){
            var new_list = [];
            if(!isQuadratic){
                for(var i=0; i<pointList.length; i++){
                    new_list.push([{y: Math.pow(findError(pointList[i]),2)}])
                }
            }
            else{
                for(var i=0; i<pointList.length; i++){
                    new_list.push([{y: Math.pow(findQuadError(pointList[i]),2)}])
                }
            }
            return new_list;
        }
        
        //returns the array of points and their absolute error
        function points_with_abs_error(isQuadratic){
            var new_list = [];
            if(!isQuadratic){
                for(var i=0; i<pointList.length; i++){
                    new_list.push([{y: findError(pointList[i])}])
                }
            }
            else{
                for(var i=0; i<pointList.length; i++){
                    new_list.push([{y: findQuadError(pointList[i])}])
                }
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
                lineCoeffs = linear_regression();
            }
                
            return lineCoeffs;
        }
        
        //returns the best fit for a horizontal line
        function bestFitHorizontal(){
            var averageY = 0;
            var n = pointList.length;
            for(var i = 0; i<n ; i++){
                averageY += pointList[i][1]/n
            }
            return [0,averageY];
        }
        
        //returns the best fit quadratic
        function bestFitQuadratic(){
            var lineCoeffs; //coefficients of y=ax^2+bx+c in the form [a,b,c]
            if(pointList.length <2){
                lineCoeffs = [0,0,0];
            }
            else if(pointList.length ==2){
                var x1 = pointList[0][0];
                var x2 = pointList[1][0];
                var y1 = pointList[0][1];
                var y2 = pointList[1][1];
                
                var b = (y2-y1)/(x2-x1);
                var c = y1 - b*x1;
                
                lineCoeffs = [0,b,c];
            }
            else{
                lineCoeffs = quadratic_regression();
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
        
        //sums the errors of the points and returns optimized a, b, and c for y = ax^2 + bx + c
        function quadratic_regression(){
            var i, x, y,
                sumx=0, sumy=0, sumx2=0, sumxy=0, sumx3=0,sumx4=0,sumx2y=0,
                a, b, c;
            var count = pointList.length;
                
            for(i=0;i<pointList.length;i++)
            {   
                // this is our data pair
                x = pointList[i][0]; y = pointList[i][1]; 
        
                sumx += x;
                sumx2 += (x*x);
                sumy += y;
                sumxy += (x*y);
                sumx3 += (x*x*x);
                sumx4 += (x*x*x*x);
                sumx2y += (x*x)*y;
            }
            
            c = -(sumx*sumx3*sumx2y -sumx*sumxy*sumx4 -sumx2y*sumx2*sumx2 + sumx2*sumy*sumx4 + sumx2*sumx3*sumxy -sumy*sumx3*sumx3)/(-count*sumx2*sumx4 +count*sumx3*sumx3 + sumx*sumx*sumx4-2*sumx*sumx2*sumx3+sumx2*sumx2*sumx2)
            
            b = -(-count*sumx3*sumx2y + count*sumxy*sumx4 + sumx2y*sumx*sumx2 - sumx*sumy*sumx4 -sumxy*sumx2*sumx2 +sumy*sumx2*sumx3)/(-count*sumx2*sumx4 +count*sumx3*sumx3 + sumx*sumx*sumx4-2*sumx*sumx2*sumx3+sumx2*sumx2*sumx2)
            
            a = -(count*sumx2*sumx2y - count*sumxy*sumx3 - sumx2y*sumx*sumx + sumx*sumx2*sumxy - sumy*sumx2*sumx2 +sumy*sumx*sumx3)/(-count*sumx2*sumx4 +count*sumx3*sumx3 + sumx*sumx*sumx4-2*sumx*sumx2*sumx3+sumx2*sumx2*sumx2)
            
            return [a,b,c];
        }
        
        //finds the statistical variance of the points
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
        
        //finds the maximums and minimums of the points
        function get_maxs_and_mins(){
            if(pointList.length<1){
                return {xMax: 10, xMin: -10, yMax: 10, yMin: -10};
            }
            var y_max = pointList[0][1];
            var y_min = pointList[0][1];
            var x_max = pointList[0][0];
            var x_min = pointList[0][0];
            for(var i=0; i<pointList.length; i++){
                if(y_max<pointList[i][1]){
                    y_max = pointList[i][1];
                }
                if(y_min>pointList[i][1]){
                    y_min = pointList[i][1];
                }
                if(x_min>pointList[i][0]){
                    x_min = pointList[i][0];
                }
                if(x_max<pointList[i][0]){
                    x_max = pointList[i][0];
                }
            }
            return {xMax: x_max, xMin: x_min, yMax: y_max, yMin: y_min};
        }
        
        return {add_point: add_point, get_point_list: get_point_list, change_line: change_line, getCoeffs: getCoeffs, 
            change_a: change_a, get_a: get_a, get_c: get_c, change_b: change_b, get_b: get_b, change_c: change_c, findError: findError, lineAt: lineAt, quadAt: quadAt, bestFit: bestFit, linear_regression: linear_regression, quadratic_regression: quadratic_regression, sumOfSquares: sumOfSquares, get_variance: get_variance, points_with_square_error: points_with_square_error, getIndexOf: getIndexOf, points_with_abs_error: points_with_abs_error, randomize_points: randomize_points, replace_point: replace_point,clear_points: clear_points, get_maxs_and_mins: get_maxs_and_mins, bestFitHorizontal: bestFitHorizontal, getQuadCoeffs: getQuadCoeffs, findQuadError: findQuadError, sumOfQuadSquares: sumOfQuadSquares, bestFitQuadratic: bestFitQuadratic};
   }
    
    function Controller(model) {
        function add_point_from_input(point){
            model.add_point(point);
        }

        function add_anscombe_from_file(number){
            model.clear_points();

            for(var i=0;i<anscombes[number].length;i++){
                model.add_point(anscombes[number][i]);
            }
        }
        
        function add_spring_from_file(){
            model.clear_points();

            for(var i=0;i<spring.length;i++){
                model.add_point(spring[i]);
            }
        }

        function add_unemployment_from_file(number){
            model.clear_points();
            for (var i = 0; i < unemployment[number].length; i++) {
                model.add_point(unemployment[number][i]);
            };
        }
        function change_best_fit_line(){
            var coeffs = model.bestFit()
            model.change_line(coeffs);
        }
        
        function change_best_fit_line_horizontal(){
            var coeffs = model.bestFitHorizontal()
            model.change_line(coeffs);
        }
        function change_best_fit_quadratic(){
            var coeffs = model.bestFitQuadratic();
            model.change_a(coeffs[0]);
            model.change_b(coeffs[1]);
            model.change_c(coeffs[2]);
        }

        return {add_unemployment_from_file:add_unemployment_from_file, add_point_from_input: add_point_from_input, add_spring_from_file: add_spring_from_file, change_best_fit_line: change_best_fit_line, change_best_fit_line_horizontal: change_best_fit_line_horizontal, change_best_fit_quadratic: change_best_fit_quadratic, add_anscombe_from_file: add_anscombe_from_file};
    }
    /* View that controls how the content is displayed to the user.
        contains instance variables:
        color_scale - a d3 object that converts numbers into colors
        
        functions: 
        setupLineControls
        setupZeroDegreeControls
        setupQuadControls
        displayLine
        displayQuad
        updatePointsOnGraph
        displayErrorInfo
        removeErrorInfo
        updateEquation
        turnErrorDisplayOn
        turnErrorDisplayOff
        makeErrorSquaredString
        setupTable
        updateTable
        clearTable
        graph
        updateBestFitDisplay
        updateDisplay
    */
    function View(div,model,controller) {    
        var color_scale = d3.scale.linear()
                .domain([0, yMax])
                .range(['#61A72D','#CC0000']);
        
        div.append("<div class='container-fluid'><div class='row-fluid'></div><div class='row-fluid'><div class='span12 well'><div class='span8 graph'></div><div class='span4 table-container'></div></div></div>");
        
        $(".table-container").append("<div class = 'row-fluid'><table class = 'table table-striped data-table'></table></div><div class='row-fluid'><input class='x-adder' placeholder = 'x'><input class='y-adder' placeholder = 'y' style = 'margin-left:5px;'><button class = 'btn btn-small add-point' type = 'button'>Add Point</button></div><br></br><div class = 'row-fluid'><input class='point-number' placeholder = '# of points' style = 'margin-right:10px; width:30%'><button class = 'btn btn-small randomize'>Randomize Points</button></div>");

        $(".graph").append("<div class='row-fluid'><div class='span8 chart-container'></div><div class='span4'><div class='graph-container'></div><div class='info-container'></div></div></div>");
        
        $(".graph").append("<div class='span8'><div class='row-fluid'><div class='buttons'></div><div class='controls'></div></div></div>");
        
        $(".buttons").append('<span>Degree of Polynomial:</span><div class="btn-group" style="margin-left: 5px"><button class="btn btn-small horizontal-line">0</button><button class="btn btn-small line">1 (Linear)</button><button class="btn btn-small parabola">2 (Quadratic)</button></div>');
        
        $(".controls").append("<div class = 'row-fluid'><div class='container-fluid'><div class='row-fluid'><div class='span4'>a:<div class='a-slider'></div><div class='a-label'></div></div><div class='span4'>b:<div class='b-slider'></div><div class='b-label'></div></div><div class='span4'>c:<div class='c-slider'></div><div class='c-label'></div></div></div><div class='row-fluid'><div class='span6'><input type = 'checkBox' class = 'plot-fit'><span style = 'margin-left:5px;'>Plot Best-Fit</span></div><div class='span6'><span class='equation' style = 'margin-left:10px'>y=ax<sup>2</sup>+bx+c</span></div></div></div></div>");
        $('.examples').remove();
        $('.table-container .row-fluid:nth-of-type(3)').append("<p><div class = 'btn-group examples'></div>");
        $('.examples').append('<button class="btn btn-small dropdown-toggle" data-toggle="dropdown" href="#">Example Data Sets<span class="caret"></span></button><ul class="dropdown-menu"><li class="dropdown-submenu"><a tabindex="-1" href="#">Anscombe\'s Quartet</a><ul class="dropdown-menu"><li><a tabindex="-1" href="#" class="anscombe" data-index="0">Anscombe 1</a></li><li><a tabindex="-1" href="#" class="anscombe" data-index="1">Anscombe 2</a></li><li><a tabindex="-1" href="#" class="anscombe" data-index="2">Anscombe 3</a></li><li><a tabindex="-1" href="#" class="anscombe" data-index="3">Anscombe 4</a></li></ul></li><li class = "dropdown-submenu"><a tabindex="-1" href="#" class = "work">Unemployment Rate</a><ul class="dropdown-menu"><li><a tabindex="-1" href="#" class="work" data-index="0">2008</a></li><li><a tabindex="-1" href="#" class="work" data-index="1">2009</a></li></ul></li><li><a tabindex="-1" href="#" class = "spring">Spring</a></li></ul>');
        
        var tooltip = d3.select("body").append("div").attr("class","point-error").text("");
        
        $(".horizontal-line").on("click",function(){
            setupZeroDegreeControls();
        })
        $(".line").on("click",function(){
            setupLineControls();
        })
        $(".parabola").on("click",function(){
            setupQuadraticControls();
        })
        var aSlider,bSlider,cSlider;
        var isQuadratic = false;
        //initialize the display as dealing with just lines
        
        aSlider = $(".a-slider").slider({ min: -10, max: 10, step: .01, slide: function( event, ui ) {
            if ($('.plot-fit').prop('checked')==true){
                $('.plot-fit').attr('checked', false);
            }
            model.change_a(ui.value);
            $('.a-label').html(ui.value);
            updateDisplay();
            } 
        
        });

        bSlider = $(".b-slider").slider({ min: 1.5*yMin, max: 1.5*yMax, step: .01,
            slide: function( event, ui ) {
                if ($('.plot-fit').prop('checked')==true){
                    $('.plot-fit').attr('checked', false);
                }
                model.change_b(ui.value);
                $('.b-label').html(ui.value);
                updateDisplay();
            },
        });
        cSlider = $(".c-slider").slider({ min: 1.5*yMin, max: 1.5*yMax, step: .01,
                slide: function( event, ui ) {
                    if ($('.plot-fit').prop('checked')==true){
                        $('.plot-fit').attr('checked', false);
                    }
                    model.change_c(ui.value);
                    $('.c-label').html(ui.value);
                    updateDisplay();
                }
        });

        setupLineControls();
        setupButtons();
        setupExamples();

        setupGraph(-10,10,-10,10);
        setupTable();
        displayLine([0,0],false);
        
        //controls for when the user wants to plot a first-order line
        function setupLineControls(){
            $(".selected-degree").removeClass("selected-degree");
            $(".line").addClass("selected-degree");
            
            isQuadratic = false; //flag for future methods that are different for lines and parabolas

            aSlider.slider( "enable" );
            cSlider.slider( "disable" );
            aSlider.slider('option','value',model.get_a());
            bSlider.slider('option','value',model.get_b());
            $('.b-label').html(round_number(model.get_b(),2));
            $('.a-label').html(round_number(model.get_a(),2));
                
            if($('.plot-fit').prop("checked")){
                updateBestFitDisplay(true);
                turnErrorDisplayOn(false);
            }
            if(chart !== undefined){
                updateDisplay();
            }
        }

        //controls for when the user wants to plot a horizontal (0 order) line
        function setupZeroDegreeControls(){
            $(".selected-degree").removeClass("selected-degree");
            $(".horizontal-line").addClass("selected-degree");

            isQuadratic = false;
            model.change_a(0);

            bSlider.slider('option','value',model.get_b());
            $('.b-label').html(round_number(model.get_b(),2));
            aSlider.slider( "disable" );
            cSlider.slider( "disable" );
            
            if($('.plot-fit').prop("checked")){
                updateBestFitDisplay(true);
                turnErrorDisplayOn(false);
            }
            if(chart !== undefined){
                updateDisplay();
            }
        }
        
        //controls for when the user wants to plot a quadratic
        function setupQuadraticControls(){
            $(".selected-degree").removeClass("selected-degree");
            $(".parabola").addClass("selected-degree");
            
            turnErrorDisplayOff();
            
            isQuadratic = true;
            model.change_c(model.get_b());
            model.change_b(model.get_a());
            model.change_a(0);
            
            aSlider.slider( "enable" );
            cSlider.slider( "enable" );
            aSlider.slider('option','value',model.get_a());
            bSlider.slider('option','value',model.get_b());
            cSlider.slider('option','value',0);
            $('.b-label').html(round_number(model.get_b(),2));
            $('.a-label').html(round_number(model.get_a(),2));
            $('.c-label').html(round_number(model.get_c(),2));
            
            if($('.plot-fit').prop("checked")){
                updateBestFitDisplay(true);
                turnQuadErrorDisplayOn(false);
            }
            updateDisplay();
        }
        
        //sets up the buttons

        function setupButtons(){
            $('.add-point').on("click",function(){
                var inputXVal = $('.x-adder').val();
                var inputYVal = $('.y-adder').val();
                var inputVal = inputXVal + inputYVal;
                // counts number of minus signs in inputXVal
                var signCount_x = (inputXVal.match(/-/g)||[]).length;
                // counts number of minus signs in inputYVal
                var signCount_y = (inputYVal.match(/-/g)||[]).length;
                var totalcount = signCount_x+signCount_y;
                console.log(signCount_x+"...."+signCount_y);

                if ((inputXVal.indexOf('-') == 0 && inputYVal.indexOf('-') == 0) && totalcount == 2){
                    isValidInput = true;
                }

                else if ((inputXVal.indexOf('-') == 0 && inputYVal.indexOf('-') == 0) && totalcount>2){
                    isValidInput = false;
                }

                else if ((inputXVal.indexOf('-') == 0||inputYVal.indexOf('-') == 0) && totalcount>1){
                    isValidInput = false;
                }

                else if (!(inputXVal.indexOf('-') == 0||inputYVal.indexOf('-') == 0) && totalcount>=1){
                    isValidInput = false;
                }

                else if (inputVal.indexOf('+') != -1||inputVal.indexOf('*') != -1||inputVal.indexOf('/') != -1||inputVal.indexOf('=') != -1) {
                    isValidInput = false;
                }

                else{
                    isValidInput = true;
                }

                if (!isValidInput || isNaN(parseFloat($('.x-adder').val())) && isNaN(parseFloat($('.y-adder').val()))){
                    $(".add-point").after('<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button><strong>Sorry!</strong> Please enter real numbers </div>');
                    $(".error")[0].play();
                }

                else {
                    var x = parseFloat($('.x-adder').val());
                    var y = parseFloat($('.y-adder').val());
                    var point = [x,y]
                    point = [parseFloat($('.x-adder').val()),parseFloat($('.y-adder').val())]
                    model.add_point(point);
                    if(x > xMax || x < xMin || y > yMax || y < yMin){
                        var maxs_mins = model.get_maxs_and_mins();
                        yMax = Math.max(Math.ceil(1.2*maxs_mins.yMax),10);
                        yMin = Math.min(Math.floor(1.2*maxs_mins.yMin),-10);
                        xMax = Math.max(Math.ceil(1.2*maxs_mins.xMax),10);
                        xMin = Math.min(Math.floor(1.2*maxs_mins.xMin),-10);
                        setupGraph(xMin,xMax,yMin,yMax);
                    }
                    updateDisplay()
                }
            });
            
            $('.plot-fit').on("click",function(){
                updateDisplay()
    
            });
    
            $('.randomize').on("click",function(){
                if ($('.point-number').val() > 0){
                    model.randomize_points($(".point-number").val());
                    setupGraph(xMin,xMax,yMin,yMax);
                    updateDisplay()
                }

                else{
                    
                    $('.table-container').append("<div class='alert' style = 'background:turquoise;color:black;'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong>Error: No input received. Please enter the # of points</strong></div>");
                    $(".error")[0].play();
                }
            });
        }
        
        //sets up interesting data sets
        function setupExamples(){
            $(".anscombe").on("click", function(){
                var example_index = parseInt($(this).attr("data-index"));
                controller.add_anscombe_from_file(example_index);
                var maxs_mins = model.get_maxs_and_mins();
                yMax = Math.ceil(1.2*maxs_mins.yMax);
                yMin = 0;
                xMax = Math.ceil(1.2*maxs_mins.xMax);
                xMin = 0;
                setupGraph(xMin,xMax,yMin,yMax);
                updateDisplay();
            });

            $('.work').on("click",function(){
                var example_index = parseInt($(this).attr("data-index"));
                controller.add_unemployment_from_file(example_index);
                var maxs_mins = model.get_maxs_and_mins();
                yMax = Math.ceil(1.2*maxs_mins.yMax);
                yMin = 0;
                xMax = Math.ceil(1.2*maxs_mins.xMax);
                xMin = 0;
                setupGraph(xMin,xMax,yMin,yMax);
                updateDisplay();
            })
            
            $('.spring').on("click",function(){
                controller.add_spring_from_file();
                var maxs_mins = model.get_maxs_and_mins();
                yMax = Math.ceil(1.2*maxs_mins.yMax);
                yMin = 0;
                xMax = Math.ceil(1.2*maxs_mins.xMax);
                xMin = 0;
                setupGraph(xMin,xMax,yMin,yMax);
                updateDisplay();
            })
        }

         //takes coefficients to y=ax+b and displays the corresponding on the graph
        function displayLine(coefficients,animate){
            
            if(!animate){
                chart.selectAll(".best-fit").data(range(xMin,xMax,0.1)).remove();
                chart.selectAll(".best-fit").data(coefficients).remove();
    
                var y1 = coefficients[0]*xMin+coefficients[1];
                var y2 = coefficients[0]*xMax+coefficients[1];
                
                chart.selectAll(".best-fit").data(coefficients).enter().append("line").attr("class", "best-fit").attr('x1', x_scale(xMin)).attr('x2', x_scale(xMax)).attr('y1', y_scale(y1)).attr('y2',y_scale(y2));
                
                turnErrorDisplayOff();
                turnErrorDisplayOn(false);
            }
            else{
//                chart.selectAll(".best-fit").data(range(xMin,xMax,0.1)).remove();
//                chart.selectAll(".best-fit").data(coefficients).remove();

                var y1 = coefficients[0]*xMin+coefficients[1];
                var y2 = coefficients[0]*xMax+coefficients[1];
                
                if(chart.selectAll(".best-fit")[0].length> 0){
                    chart.selectAll(".best-fit").transition().duration(750).attr('x1', x_scale(xMin)).attr('x2', x_scale(xMax)).attr('y1', y_scale(y1)).attr('y2',y_scale(y2));
                }
                else{
                     chart.selectAll(".best-fit").data(coefficients).enter().append("line").attr("class", "best-fit").attr('x1', x_scale(xMin)).attr('x2', x_scale(xMax)).attr('y1', y_scale(y1)).attr('y2',y_scale(y2));
                }
                
                turnErrorDisplayOn(true);
            }
            updateTable();

        }
        
        //displays the model's current quadratic to the svg
        function displayQuad(animate){
            var coefficients = model.getQuadCoeffs();
            //chart.selectAll(".best-fit").data(model.getCoeffs()).remove();

            if(!animate){
                chart.selectAll(".best-fit").remove();
                //chart.selectAll(".best-fit").data(range(xMin,xMax,0.2)).remove();
        
                chart.selectAll(".best-fit").data(range(xMin,xMax,0.2)).enter().append("line").attr("class", "best-fit").attr('x1', function(d){return x_scale(d);}).attr('x2', function(d){return x_scale(d+0.2);}).attr('y1', function(d){return y_scale(coefficients[0]*d*d+coefficients[1]*d+coefficients[2])}).attr('y2',function(d){return y_scale(coefficients[0]*(d+0.2)*(d+0.2) + coefficients[1]*(d+0.2)+coefficients[2])});
                turnErrorDisplayOff();
                turnQuadErrorDisplayOn(false);
            }
            else{
                if(chart.selectAll(".best-fit")[0].length < 3){
                    chart.selectAll(".best-fit").remove();
                    chart.selectAll(".best-fit").data(range(xMin,xMax,0.2)).enter().append("line").attr("class", "best-fit").attr('x1', function(d){return x_scale(d);}).attr('x2', function(d){return x_scale(d+0.2);}).attr('y1', function(d){return y_scale(coefficients[0]*d*d+coefficients[1]*d+coefficients[2])}).attr('y2',function(d){return y_scale(coefficients[0]*(d+0.2)*(d+0.2) + coefficients[1]*(d+0.2)+coefficients[2])});
                }
                else{
                    chart.selectAll(".best-fit").data(range(xMin,xMax,0.2)).transition().duration(750).attr('x1', function(d){return x_scale(d);}).attr('x2', function(d){return x_scale(d+0.2);}).attr('y1', function(d){return y_scale(coefficients[0]*d*d+coefficients[1]*d+coefficients[2])}).attr('y2',function(d){return y_scale(coefficients[0]*(d+0.2)*(d+0.2) + coefficients[1]*(d+0.2)+coefficients[2])});
                }
                
                turnQuadErrorDisplayOn(true);
            }
            
            updateTable();
        }
    
        //plots all the points in the model's pointList to the svg
        function updatePointsOnGraph(){
            chart.selectAll(".datapoint").remove();
            var points = model.get_point_list()
            var point_index;
            chart.selectAll(".datapoint").data(points).enter().append("circle")
                .attr("class", "datapoint")
                .attr("cx", function(d){return x_scale(d[0])})
                .attr("cy", function(d){return y_scale(d[1])})
                .on("mouseover", function(d){
                    point_index = model.getIndexOf(d[0],d[1]);
                    $('tr').find('#'+point_index).closest("tr").css("outline","2px solid blue");
                    $('.graphic > .translation > .layer:nth-of-type('+(point_index+1)+')').css("stroke","black");
                    $('.graphic > .translation > .layer:nth-of-type('+(point_index+1)+')').css("stroke","blue").css("stroke-width","3").css("stroke","5,3");
                    if($('.line').hasClass("selected-degree") || $('.horizontal-line').hasClass("selected-degree")){
                        tooltip.html("<table class='table'><th>Error: "+round_number(model.findError([d[0],d[1]]),3)+"</th><th>Squared Error: "+round_number(Math.pow(model.findError([d[0],d[1]]),2),3)+"</th></table>").style("visibility", "visible");
                    }
                    else{
                        tooltip.html("<table class='table'><th>Error: "+round_number(model.findQuadError(d),3)+"</th><th>Squared Error: "+round_number(Math.pow(model.findQuadError(d),2),3)+"</th></table>").style("visibility", "visible");
                    }
                })
                .on("mousemove", function(){
                    tooltip.style("top",(d3.event.pageY+10)+"px").style("left",(d3.event.pageX+10)+"px");
                })
                .on("mouseout",function(){
                    $('tr').find('#'+point_index).closest("tr").css("outline","none");
                    $('.graphic > .translation > .layer:nth-of-type('+(point_index+1)+')').css("stroke","none");
                    tooltip.style("visibility", "hidden");
                })
                .attr("id", function(d){
                    point_index = model.getIndexOf(d[0],d[1]);
                    return point_index;
                })
                .style("fill","blue")
                .on("mouseup",clicked)
                .call(move)
                .attr("r", "4");
        }
        
        //shows the total error and sum of squares error
        function displayErrorInfo(){
            $(".info-container").empty();
            $(".info-container").append("<div class='row-fluid'><span class = 'squared'></span></div>");
            if(!isQuadratic){
                $(".squared").html("Total squared error: " +round_number(model.sumOfSquares(),2));
            }
            else{
                $(".squared").html("Total squared error: " +round_number(model.sumOfQuadSquares(),2));
            }
            
        }
        
        //updates the displays equation to have the proper a, b [and c, for quadratics]
        function updateEquation(){
            if($(".horizontal-line").hasClass("selected-degree") || $(".line").hasClass("selected-degree")){
                var coefficients = model.getCoeffs();
                $('.equation').html("y = <span class='a-display' contenteditable = 'true'>"+round_number(coefficients[0],2)+"</span>x + (<span class='b-display' contenteditable = 'true'>" + round_number(coefficients[1],2) + "</span>)");
            }
            else{
                var coefficients = model.getQuadCoeffs();
                $('.equation').html("y = <span class='a-display' contenteditable = 'true'>"+round_number(coefficients[0],2)+"</span>x<sup>2</sup> + (<span class='b-display' contenteditable = 'true'>" + round_number(coefficients[1],2) + "</span>)x + (<span class='c-display' contenteditable = 'true'>"+ round_number(coefficients[2],2)+"</span>)");
            }
            
            var contentsA = $('.a-display').html();
            $('.a-display').blur(function() {
                if (contentsA!=$(this).html()){
                    model.change_a(parseFloat($(this).html()));
                    contentsA = $(this).html();
                    aSlider.slider("option","value",model.get_a());
                    $('.a-label').html(round_number(model.get_a(),2));
                    updateDisplay();
                }
            });
            var contentsB = $('.b-display').html();
            $('.b-display').blur(function() {
                if (contentsB!=$(this).html()){
                    model.change_b(parseFloat($(this).html()));
                    contentsB = $(this).html();
                    bSlider.slider("option","value",model.get_b());
                    $('.b-label').html(round_number(model.get_b(),2));
                    updateDisplay();
                }
            });
            var contentsC = $('.c-display').html();
            $('.c-display').blur(function() {
                if (contentsC!=$(this).html()){
                    model.change_c(parseFloat($(this).html()));
                    contentsC = $(this).html();
                    cSlider.slider("option","value",model.get_c());
                    $('.c-label').html(round_number(model.get_c(),2));
                    updateDisplay();
                }
            });
        }

        function removeErrorInfo(){
            $(".info-container").empty();
            $(".squared").popover('disable');
        }
        
        function clicked(){
             console.log(d3.select(this).attr("id"))
        }
            
        //adds vertical bars from point to best-fit line (with color scale that displays how much error)
        function turnErrorDisplayOn(animate){
            if(!animate){
                chart.selectAll(".error-line").data(model.get_point_list()).enter().append("line").attr("class", "error-line").attr('x1', function(d){return x_scale(d[0])}).attr('x2', function(d){ return x_scale(d[0])}).attr('y1', function(d){ return y_scale(d[1])}).attr('y2',function(d){ return y_scale(model.lineAt(d[0]))}).style("stroke", function(d) {return color_scale(model.findError(d)); });
            }
            else{
                chart.selectAll(".error-line").data(model.get_point_list()).transition().duration(750).attr('x1', function(d){return x_scale(d[0])}).attr('x2', function(d){ return x_scale(d[0])}).attr('y1', function(d){ return y_scale(d[1])}).attr('y2',function(d){ return y_scale(model.lineAt(d[0]))}).style("stroke", function(d) {return color_scale(model.findError(d)); });
            }
            
            displayErrorInfo()
            
            $(".squared").popover({trigger: 'hover', title: "Sum of Squares Value", content: makeErrorSquareString(color_scale).unsolved + "<br>=</br>" + makeErrorSquareString(color_scale).solved, html: true});
        }

        //adds vertical bars from point to the quadratic (color-coded by how far away)

        function turnQuadErrorDisplayOn(animate){
            if(!animate){
                chart.selectAll(".error-line").data(model.get_point_list()).enter().append("line").attr("class", "error-line").attr('x1', function(d){return x_scale(d[0])}).attr('x2', function(d){ return x_scale(d[0])}).attr('y1', function(d){ return y_scale(d[1])}).attr('y2',function(d){ return y_scale(model.quadAt(d[0]))}).style("stroke", function(d) {return color_scale(model.findQuadError(d)); });
            }
           else{
                chart.selectAll(".error-line").transition().duration(750).attr('x1', function(d){return x_scale(d[0])}).attr('x2', function(d){ return x_scale(d[0])}).attr('y1', function(d){ return y_scale(d[1])}).attr('y2',function(d){ return y_scale(model.quadAt(d[0]))}).style("stroke", function(d) {return color_scale(model.findQuadError(d)); });
           }
            
            displayErrorInfo()
            
            $(".squared").popover({trigger: 'hover', title: "Sum of Squares Value", content: makeErrorSquareString(color_scale).unsolved + "<br>=</br>" + makeErrorSquareString(color_scale).solved, html: true});
        }

        var move =  d3.behavior.drag()
                    .on("drag",drag)
                    .on("dragend",function(){
                        dict.length = 0;
                        var dragPoint = d3.select(this);
                        var newX = x_scale2(parseInt(dragPoint.attr("cx")));
                        var newY = y_scale2(parseInt(dragPoint.attr("cy")));
                 
                        model.replace_point(dragPoint.attr("id"),newX,newY);
                        updateDisplay();
                        
                    
                });

            function drag(){
                var dragPoint = d3.select(this);
                dragPoint
                .attr("cx",function(){return d3.event.dx + parseInt(dragPoint.attr("cx"));})
                .attr("cy",function(){return d3.event.dy +parseInt(dragPoint.attr("cy"));})
            }
        
        //returns a string that shows how the sum of squares error was calculated by color
        function makeErrorSquareString(color_scale){
            var points = model.get_point_list();
            var errorArrayOne = [];
            var errorArrayTwo = [];
            for(var i = 0; i<points.length; i++){
                errorArrayOne.push("<span style='color:" + color_scale(model.findError(points[i])) + ";'>(" + round_number(model.findError(points[i]),2) + ")<sup>2</sup></span>");
                errorArrayTwo.push("<span style='color:" + color_scale(model.findError(points[i])) + ";'>(" + round_number(Math.pow(model.findError(points[i]), 2),2)+ ")</span>");
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
            $('.data-table').append("<thead><tr><th></th><th>Observed x</th><th>Observed y</th><th>Predicted y</th><th>Error</th><th>Squared Error</th></tr></thead>");
        }
        
        //adds point data to each row of table
        function updateTable(){
            clearTable()
            var points = model.get_point_list();
            for(var i = 0; i<points.length; i++){
                if($('.line').hasClass("selected-degree") || $('.horizontal-line').hasClass("selected-degree")){
                    $('.data-table').append("<tr><td><form><input type = 'checkBox' class = 'selector' checked id='"+i+"'></form></td><td contenteditable class='x-display' id='"+i+"'>"+round_number(points[i][0],2)+"</td><td contenteditable class='y-display' id='"+i+"'>"+round_number(points[i][1],2)+"</td><td>"+round_number(model.lineAt(points[i][0]),2)+"</td><td>"+round_number(model.findError(points[i]),2)+"</td><td>"+round_number(Math.pow(model.findError(points[i]),2),2)+"</td></tr>");
                }
                else{
                    $('.data-table').append("<tr><input type = 'checkBox' class = 'selector' checked id='"+i+"'><td contenteditable class='x-display' id='"+i+"'>"+round_number(points[i][0],2)+"</td><td contenteditable class='y-display' id='"+i+"'>"+round_number(points[i][1],2)+"</td><td>"+round_number(model.quadAt(points[i][0]),2)+"</td><td>"+round_number(model.findQuadError(points[i]),2)+"</td><td>"+round_number(Math.pow(model.findQuadError(points[i]),2),2)+"</td></tr>");
                }
            }
            
            var contentsX = $('.x-display').html();
            $('.x-display').blur(function() {
                if (contentsX!=$(this).html()){
                    model.replace_point(parseInt($(this).attr("id")), parseFloat($(this).html()),parseFloat($(this).closest("tr").find("td:nth-of-type(3)").html()));
                    contentsX = $(this).html();
                    updateDisplay();
                }
            });
            var contentsY = $('.y-display').html();
            $('.y-display').blur(function() {
                if (contentsY!=$(this).html()){
                    model.replace_point(parseInt($(this).attr("id")),parseFloat($(this).closest("tr").find("td:nth-of-type(2)").html()),parseFloat($(this).html()));
                    contentsY = $(this).html();
                    updateDisplay();
                }
            });
            if($('.line').hasClass("selected-degree") || $('.horizontal-line').hasClass("selected-degree")){
                $('.data-table').append("<tr><th>Total:</th><td></td><td></td><td></td><td></td><th>"+round_number(model.sumOfSquares(),2)+"</th></tr>");
            }
            else{
                $('.data-table').append("<tr><th>Total:</th><td></td><td></td><td></td><td></td><th>"+round_number(model.sumOfQuadSquares(),2)+"</th></tr>");
            }
        }
    
        //empties the data table
        function clearTable(){
            $(".data-table").find("tr:gt(0)").remove();
        }

        //displays the graph of sum of squared error, color coded to show which point contributes which block of error
        function graph(){
            $(".graph-container").empty();
            var maxValue = model.get_variance()*5;
            //var title = "Sum of Squares";
            var data = model.points_with_square_error(isQuadratic);
            
            var normal_error = model.points_with_abs_error(isQuadratic);
            
            var graph_outer_width = parseInt($(".graph-container").css("width"))*0.8;
            var graph_outer_height = 300;
            var graph_margin = { top: graph_outer_width/8, right: graph_outer_width/8, bottom: graph_outer_width/8, left: graph_outer_width/8 }
            var graph_chart_width = graph_outer_width - graph_margin.left - graph_margin.right;
            var graph_chart_height = graph_outer_height -graph_margin.top - graph_margin.bottom;
                    
            var graph_y_scale = d3.scale.linear().domain([0,maxValue]).range([graph_chart_height,0]);
            
            var graph_chart = d3.select(".graph-container").append("svg").attr("class","graphic").attr("height", graph_outer_height).attr("width",graph_outer_width).append("g").attr("class","translation").attr("transform","translate(" + (graph_margin.left+graph_margin.right) + "," + (graph_margin.top + graph_margin.bottom -5)+ ")");
                
            graph_chart.selectAll(".y-scale-label").data(graph_y_scale.ticks(4)).enter().append("text").attr("class", "y-scale-label").attr("x",graph_margin.left/2).attr('y',graph_y_scale).attr("text-anchor","end").attr("dy","0.3em").attr("dx",-graph_margin.left/2).text(function(d){return d});
            
            //graph_chart.selectAll(".chart-title").data([1]).enter().append("text").attr("class", "chart-title").attr("x",0).attr('y',0).text(title);
            
            if(data.length>0){
                var stack = d3.layout.stack();
                var stacked_data = stack(data);
                var layer_groups = graph_chart.selectAll(".layer").data(stacked_data).enter().append("g").attr("class", "layer");
                
                var rects = layer_groups.selectAll('rect').data(function(d){return d}).enter().append('rect').attr("x",0).style("fill", function(d, i, j) {return color_scale(normal_error[j][0].y);}).attr("height", 0).attr("y", function(d){return graph_y_scale(d.y0)}).attr("y", function(d){return graph_y_scale(d.y0+d.y)}).attr("width", graph_chart_width).attr("height", function(d){ return graph_y_scale(d.y0) - graph_y_scale(d.y0+d.y); });
            }
            

      }
        
        //plots the best fit line or quadratic
        function updateBestFitDisplay(animate){
            if($(".line").hasClass("selected-degree")){
                controller.change_best_fit_line();
                var coefficients = model.getCoeffs();
                aSlider.slider("option","value",coefficients[0]);
                $('.a-label').html(round_number(coefficients[0],2));
                displayLine(coefficients,animate);
            }
            
            else if($(".horizontal-line").hasClass("selected-degree")){
                controller.change_best_fit_line_horizontal();
                var coefficients = model.getCoeffs();
                displayLine(coefficients,animate);
            }
            else{
                controller.change_best_fit_quadratic();
                var coefficients = model.getQuadCoeffs();
                aSlider.slider("option","value",coefficients[0]);
                $('.a-label').html(round_number(coefficients[0],2));
                cSlider.slider("option","value",coefficients[2]);
                $('.c-label').html(round_number(coefficients[2],2));
                displayQuad(animate);
                turnErrorDisplayOff();
                turnQuadErrorDisplayOn(false);
            }
            bSlider.slider("option","value",coefficients[1]);
            $('.b-label').html(round_number(coefficients[1],2));
            updateEquation();
        }

        //updates the points, error bars, graph, equation, and table
        function updateDisplay(){
            updatePointsOnGraph();
            if($('.plot-fit').prop("checked")){
                updateBestFitDisplay(true);
            }
            else if($('.line').hasClass("selected-degree") || $('.horizontal-line').hasClass("selected-degree")){
                displayLine(model.getCoeffs(),false);
            }
            else{
                displayQuad(false);
            }
            //turnErrorDisplayOff();
            if($('.line').hasClass("selected-degree") || $('.horizontal-line').hasClass("selected-degree")){
                turnErrorDisplayOn(false);
            }
            else{
                turnQuadErrorDisplayOn();
            }
            displayErrorInfo();
            updateTable();
            updateEquation();
            graph();
        }


        
        return {displayLine: displayLine, displayQuad: displayQuad, displayErrorInfo: displayErrorInfo, updateBestFitDisplay: updateBestFitDisplay, updateEquation: updateEquation, updateTable: updateTable, updatePointsOnGraph: updatePointsOnGraph, updateDisplay: updateDisplay};
    }
    
    //set up svg with axes and labels
    function setupGraph(xMin,xMax,yMin,yMax){
        xMin = xMin;
        xMax = xMax;
        yMin = yMin;
        yMax = yMax;

        x_scale = d3.scale.linear().domain([xMin,xMax]).range([0,chart_width]);
        y_scale = d3.scale.linear().domain([yMin,yMax]).range([chart_height,0]);
        x_scale2 = d3.scale.linear().domain([0,chart_width]).range([xMin,xMax]);
        y_scale2 = d3.scale.linear().domain([chart_height,0]).range([yMin,yMax]);
        
        $(".chart-container").empty();
        chart = d3.select(".chart-container").append("svg").attr("class","chart").attr("height", outer_height).attr("width",outer_width).append("g").attr("transform","translate(" + margin.left + "," + margin.top + ")");
        
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
        
        //initializes a nice little set of 4 points to begin with
        var points = [[4,4],[1,1],[2,1],[-3,6]];
        for(var i =0; i<points.length; i++){
            model.add_point([points[i][0],points[i][1]]);
        }
        view.updateDisplay();
    }; 
    
    exports.setup = setup;
    exports.round_number = round_number;
    exports.model = Model;
    exports.view = View;
    exports.controller = Controller;

    return exports;
}());

$(document).ready(function() {
    lineFit.setup($('.line-fit'));
    $('#elem').popover();
    $('#elem1').popover();
});

$(window).resize(function(){
   var bodyheight = $(document).height(); 
   var bodywidth = $(document).width();
   $('.line-fit').height(bodyheight);
   $('.line-fit').width(bodywidth);
})