// Set original SVG dimension
var svgWidth = 1000;
var svgHeight = 600;

// Set chart margins
var margin = {
	 top: 70,
	 right: 60,
	 bottom: 125,
	 left: 170
	};

// Define dimensions of the chart area
var chartWidth = svgWidth - margin.left - margin.right;
var chartHeight = svgHeight - margin.top - margin.bottom;

// Append SVG area to scatter plot, and set dimension
var svg = d3.select("#scatter")
			.append("svg")
			.classed("chart", true)
			.attr("width", svgWidth)
			.attr("height", svgHeight);

// shift everything over by the margins
var chartGroup = svg.append("g")
	.attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params
var acsData = null;  // Store the chart data
var chosenXAxis = "poverty";  // Default initial x-axis label
var chosenYAxis = "obesity";  // Default initial y-axis label
var xAxisLabels = ["poverty", "age", "income"];  // Default
var yAxisLabels = ["obesity", "smokes", "healthcare"];
var labelsTitle = {"poverty": "In Poverty (%)", 
                   "age": "Median Age", 
                   "income": "Median Household Income",
                   "obesity": "Obesity (%)", 
                   "smokes": "Smokes (%)", 
                   "healthcare": "Lacks Healthcare (%)"};
var axisPadding = 20;

// Function used for xy-scale var upon click on axis label text
function scale(acsData, chosenAxis, xy) {
	var axisRange = (xy === "x") ? [0, chartWidth]: [chartHeight, 0]
    
    // create scales for chosen axis
    var linearScale = d3.scaleLinear()
		.domain([d3.min(acsData, d => d[chosenAxis]) * 0.8,
				 d3.max(acsData, d => d[chosenAxis]) * 1.2])
		.range(axisRange);
  
    return linearScale;
};

// Function used for updating xyAxis var upon click on axis label text
function renderAxis(newScale, Axis, xy) {
	var posAxis = (xy === "x") ? d3.axisBottom(newScale): d3.axisLeft(newScale)  
    // Redner transition between xy-axis change
    Axis.transition()
		.duration(1000)
		.call(posAxis);
	return Axis;
};

// Function used for updating circles group with a transition to
function renderCircles(elemEnter, newScale, chosenAxis, xy) {
    // Render transition of circles
    elemEnter.selectAll("circle")
			 .transition()
			 .duration(1000)
			 .attr(`c${xy}`, d => newScale(d[chosenAxis]));
    // Render transition of text
    elemEnter.selectAll("text")
			 .transition()
			 .duration(1000)
			 .attr(`d${xy}`, d => newScale(d[chosenAxis]));
	return elemEnter;
};

// Function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, chosenYAxis, elemEnter) {
	// Setup the tool tip.
    var tool_tip = d3.tip()
		.attr("class", "d3-tip")
        .offset([-8, 0])
        .html(d => `${d.state} <br>${chosenXAxis}: ${d[chosenXAxis]} <br>${chosenYAxis}: ${d[chosenYAxis]}`);
    svg.call(tool_tip);

    // Assign hover events
    elemEnter.classed("active inactive", true)
			 .on('mouseover', tool_tip.show)
			 .on('mouseout', tool_tip.hide);   
    return elemEnter;
};

// function update the scatter chart based on the selected axis label change
function updateChart() {
	// Get value of the selected axis label
	var value = d3.select(this).attr("value");
    // Get the x or y axis the value belongs to
    var xy = xAxisLabels.includes(value) ? "x":"y";
    // Get the element enter
    var elemEnter = d3.selectAll("#elemEnter");
    // Get the xAxis or yAxis tag object
    var axis = (xy==="x") ? d3.select("#xAxis"):d3.select("#yAxis");
    //  Select the chosenAxis
    chosenAxis = (xy === "x") ? chosenXAxis:chosenYAxis;

    if (value !== chosenAxis) {
		// Replaces chosenAxis with selected value
        if(xy === "x") {
			chosenXAxis = value;
		}
        else {
            chosenYAxis = value;
        };

        // Update new chosenAxis
        chosenAxis = (xy === "x") ? chosenXAxis:chosenYAxis;
        // Updates xy scale for new data
        linearScale = scale(acsData, chosenAxis, xy);
        // Updates chosen axis with transition
        axis = renderAxis(linearScale, axis, xy);
        // Updates circles with new chosen axis values
        elemEnter = renderCircles(elemEnter, linearScale, chosenAxis, xy);
        // Updates tooltips with new info
        elemEnter = updateToolTip(chosenXAxis, chosenYAxis, elemEnter);
        // Parse through the chosen Axis Labels and reset the active/inactive + visibility
        axisLabels = (xy === "x") ? xAxisLabels: yAxisLabels
        axisLabels.forEach(label => {
			if(label === value) {
				// Text Label
				d3.select(`[value = ${label}]`).classed("active", true);
				d3.select(`[value = ${label}]`).classed("inactive", false);
                // Rect switch axis
                d3.select(`[value = ${xy+label}]`).classed("invisible", true);
            }
            else { // Not selected
                // Text Label
                d3.select(`[value = ${label}]`).classed("active", false);
                d3.select(`[value = ${label}]`).classed("inactive", true);
                // Rect switch axis
                d3.select(`[value = ${xy+label}]`).classed("invisible", false);
            };
        });
    };
};

// Function updates the axis labels tooptip on the rect tag
function updateLabelsTooltip(xy, labelEnter) {
	// Reverse xy for move to opposite axis
    xy = (xy === "x") ? "y": "x";
    // Add tooltip to the rect tag
    var tool_tip = d3.tip()
		.attr("class", "d3-tip")
        .offset([-10, 0])
        .html(d => `Move ${d} to ${xy}-axis`);
    svg.call(tool_tip);

    // Add the event handlers
    labelEnter.classed("active inactive", true)
			  .on("mouseenter", tool_tip.show)
			  .on("mouseleave", tool_tip.hide)
			  .on("mousedown", tool_tip.hide);

    return labelEnter;
};

// Function updates the rect tag into axis label group
function updateLabelsRect(xy, xPos, labelsRect) {
    // Set the size of the square (rect)
    var squareSize = 12;
    // Define chosenAxis by xy
    var chosenAxis = (xy === "x") ? chosenXAxis : chosenYAxis;
    // Add rect tag
    var enterlabelsRect = null;
    // Append rect tag
    enterlabelsRect = labelsRect.enter()
        .append("rect")
        .merge(labelsRect)
        .attr("x", xPos)
        .attr("y", (d,i) => (i+1)*axisPadding-squareSize)
        .attr("width", squareSize)
        .attr("height", squareSize)
        .classed("stateRect", true)
        .classed("invisible", d => (d === chosenAxis) ? true:false)
        .attr("value", d => xy+d)
        .on("click", updateLabel);

    // Return enter to be able to append tooltip
    return enterlabelsRect;
};

// Function updates the text tag into axis label group
function updateLabelsText(xy, xPos, labelsText) {
    // Define chosenAxis by xy
    var chosenAxis = (xy === "x") ? chosenXAxis : chosenYAxis;
    // Add text tag
    var enterlabelsText = null; labelsText.enter()
		.append("text");
    // Append text tag
    enterlabelsText = labelsText.enter()
		.append("text")
        .merge(labelsText)
        .attr("x", xPos)
        .attr("y", (d,i) => (i+1)*axisPadding)
        .attr("value", d => d) // value to grab for event listener
        .classed("active", d => (d === chosenAxis) ? true:false)
        .classed("inactive", d => (d === chosenAxis) ? false:true)
        .text(d => labelsTitle[d])
        .on("click", updateChart);
};

// Function updates the axis labels after moving one of the axes
function updateLabel() {
    // Get move value of selection and slice it for the xy axis and axis label value
    var moveLabel = d3.select(this).attr("value");
    var oldAxis = moveLabel.slice(0,1);
    var selectedLabel = moveLabel.slice(1);

    // Move axis label to the other axis
    if (oldAxis === "x") {
        // Remove label from x-axis labels
        xAxisLabels = xAxisLabels.filter(e => e !== selectedLabel);
        // Add label to yLabels labels
        yAxisLabels.push(selectedLabel);
    } 
    else {
        // Remove label from y-axis labels
        yAxisLabels = yAxisLabels.filter(e => e !== selectedLabel);
        // Add label to xLabels labels
        xAxisLabels.push(selectedLabel);
    };

    // Update group for x axis labels group of rect + text
    var xLabels = d3.select("#xLabels");
    // Append the rect for move labels
    var xLabelsRect = xLabels.selectAll("rect")
        .data(xAxisLabels);
    // Update labels rect tags
    xEnterLabelsRect = updateLabelsRect("x", -120, xLabelsRect);
    // Update tooptip on rect
    updateLabelsTooltip("x", xEnterLabelsRect);
    // Remove old labels rect
    xLabelsRect.exit().remove();
    // Append the text for the x-axis labels
    var xLabelsText = xLabels.selectAll("text")
        .data(xAxisLabels);
    // Update labels text
    updateLabelsText("x", 0, xLabelsText);
    // Remove any excess old data
    xLabelsText.exit().remove();
    // Update group for y axis labels group of rect + text
    var yLabels = d3.select("#yLabels");
    // Append the rect for move labels
    var yLabelsRect = yLabels.selectAll("rect")
        .data(yAxisLabels);
    // Update labels rect tags
    yEnterLabelsRect = updateLabelsRect("y", -45, yLabelsRect);
    // Update tooptip on rect tags
    updateLabelsTooltip("y", yEnterLabelsRect);
    // Remove old labels rect tags
    yLabelsRect.exit().remove();
    // Append the text for the x-axis labels
    var yLabelsText = yLabels.selectAll("text")
        .data(yAxisLabels);
    // Update labels text tag
    updateLabelsText("y", margin.top, yLabelsText);
    // Remove any excess old data
    yLabelsText.exit().remove();
};

// Function initialize the chart elements
function init() {
    // Radius for circles
    var r = 15;
    // Create initial xLinearScale, yLinearScale
    var xLinearScale = scale(acsData, chosenXAxis, "x");
    var yLinearScale = scale(acsData, chosenYAxis, "y");

    // Create initial axis
    var bottomAxis = d3.axisBottom(xLinearScale);
    var leftAxis = d3.axisLeft(yLinearScale);

    // Append x axis
    var xAxis = chartGroup.append("g")
		.classed("axis", true)
        .attr("transform", `translate(0, ${chartHeight})`)
        .attr("id", "xAxis")
        .call(bottomAxis);

    // Append y axis
    var yAxis = chartGroup.append("g")
		.classed("axis", true)
		.attr("id", "yAxis")
		.call(leftAxis);
      
    // Define the data for the circles + text
    var elem = chartGroup.selectAll("g circle")
		.data(acsData);
 
    // Create and place the blocks containing the circle and the text  
    var elemEnter = elem.enter()
        .append("g")
        .attr("id", "elemEnter");
    
    // Create the circle for each block
    elemEnter.append("circle")
        .attr('cx', d => xLinearScale(d[chosenXAxis]))
        .attr('cy', d => yLinearScale(d[chosenYAxis]))
        .attr('r', r)
        .style("fill", "#1e0031")
        .classed("stateCircle", true);
    
    // Create the text for each circle
    elemEnter.append("text")
        .attr("dx", d => xLinearScale(d[chosenXAxis]))
        .attr("dy", d => yLinearScale(d[chosenYAxis]))
        .style("fill", "whitesmoke")
        .classed("stateText", true)
        .attr("font-size", parseInt(r * 0.8))
        .text(d => d.abbr);
  
    // Create group for xLabels: x-axis label
    var xLabels = chartGroup.append("g")
        .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + 20})`)
        .classed("atext", true)
        .attr("id", "xLabels");

    // Create rect for x-axis move label
    var xLabelsRect = xLabels.selectAll("rect")
        .data(xAxisLabels)
    var enterXLabelsRect = xLabelsRect.enter()
        .append("rect")
        .attr("x", -120)
        .attr("y", (d, i) => (i + 1) * axisPadding - 12)
        .attr("width", 12)
        .attr("height", 12)
        .classed("stateRect", true)
        .classed("invisible", d => (d === chosenXAxis) ? true: false)
        .attr("value", d => "x" + d)
        .on("click", updateLabel);
    
    // Update tooptip on rect
    updateLabelsTooltip("x", enterXLabelsRect);
    // Create text of the x-axis label
    xLabels.selectAll("text")
		   .data(xAxisLabels)
		   .enter()
		   .append("text")
		   .attr("x", 0)
		   .attr("y", (d,i) => (i + 1) * axisPadding)
		   .attr("value", d => d) // value to grab for event listener
		   .classed("active", d => (d === chosenXAxis) ? true: false)
		   .classed("inactive", d => (d === chosenXAxis) ? false: true)
		   .text(d => labelsTitle[d])
		   .on("click", updateChart);

    // Create group for yLabels: y-axis labels
    var yLabels = chartGroup.append("g")
        .attr("transform", `rotate(-90 ${(margin.left / 2)} ${(chartHeight / 2) + 60})`)
        .classed("atext", true)
        .attr("id", "yLabels");
    // Create rect for y-axis move label
    var yLabelsRect = yLabels.selectAll("rect")
        .data(yAxisLabels);
    var enterYLabelsRect = yLabelsRect.enter()
        .append("rect")
        .attr("x", -45)
        .attr("y", (d,i) => (i + 1) * axisPadding - 12)
        .attr("width", 12)
        .attr("height", 12)
        .classed("stateRect", true)
        .classed("invisible", d => (d === chosenYAxis) ? true: false)
        .attr("value", d => "y" + d)
        .on("click", updateLabel);
    
    // Update tooptip on rect
    updateLabelsTooltip("y", enterYLabelsRect);
    // Create text of the y-axis label
    yLabels.selectAll("text")
		   .data(yAxisLabels)
		   .enter()
		   .append("text")
		   .attr("x", margin.top)
		   .attr("y", (d, i) => (i + 1) * axisPadding)
           .attr("value", d => d) // value to grab for event listener
           .classed("active", d => (d === chosenYAxis) ? true: false)
           .classed("inactive", d => (d === chosenYAxis) ? false: true)
           .text(d => labelsTitle[d])
           .on("click", updateChart);

    // UpdateToolTip function
    var elemEnter = updateToolTip(chosenXAxis, chosenYAxis, elemEnter);
};

// Load data from data.csv
d3.csv("assets/data/data.csv").then((data, error) => {
    // Throw an error if one occurs
    if (error) throw error;
  
    // Parse data: Cast the data values to a number
    data.forEach(d => {
		d.poverty =+ d.poverty;
		d.age =+ d.age;
		d.income =+ d.income;
		d.obesity =+ d.obesity;
		d.healthcare =+ d.healthcare;
		d.smokes =+ d.smokes;
    });

    // Load data into acsData
    acsData = data;
    // Initialize scatter chart
    init();
});