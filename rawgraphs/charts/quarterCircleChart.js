(function() {
  /* Creation of model */
  let model = raw.model()

  let dimNameElements = model.dimension()
    .title('Name of Elements')
    .types(String)
    .required(1)

  let dimX = model.dimension()
    .title('X Axis')
    .types(Number)
    .required(1)

  let dimY = model.dimension()
    .title('Y Axis')
    .types(Number)
    .required(1)

  let dimSizeElements = model.dimension()
    .title('Size of Elements')


    .types(Number)

  let dimColorElements = model.dimension()
    .title('Color of Elements')
    .types(Number, String)

  /* Map function */
  let nameDimensions = {}
  model.map(data => {

    return data.map((el, i) => {
      if (i === 0) {
        nameDimensions = {
          nameDimNameElements: dimNameElements()[0],
          nameDimX: dimX()[0],
          nameDimY: dimY()[0],
          nameDimSizeElements: (dimSizeElements())?dimSizeElements()[0]:false,
          nameDimColorElements: (dimColorElements())?dimColorElements()[0]:false
        }
      }

      return {
        dimNameElements: el[dimNameElements()],
        dimX: el[dimX()],
        dimY: el[dimY()],
        dimSizeElements: el[dimSizeElements()],
        dimColorElements: el[dimColorElements()]
      }
    })
  })

  /* Definition of chart options */
  let chart = raw.chart()
  chart.model(model)
  chart.title('Quarter Circle Chart')
    .description('Quarter circle scatter plot')

  let rawWidth = chart.number()
    .title('Width')
    .defaultValue(900)

  let rawHeight = chart.number()
    .title('Height')
    .defaultValue(900)

  let colors  = chart.color()
    .title('Color scale')

  let margin = chart.number()
    .title('Margin')
    .defaultValue(10)

  /* Drawing function */
  chart.draw(function(selection, data) {
    console.log('chartData', data)
    let dimNameElements = "dimNameElements"
    let dimX = "dimX"
    let dimY = "dimY"
    let dimSizeElements = "dimSizeElements"
    let dimColorElements = "dimColorElements"
    let nameDimX = nameDimensions.nameDimX
    let nameDimY = nameDimensions.nameDimY
    let nameDimSizeElements = nameDimensions.nameDimSizeElements
    let nameDimColorElements = nameDimensions.nameDimColorElements

    // Name of arcs
    let nameQuarterArcs = ['Leaders', 'Strong Performers', 'Contenders', 'Challengers']

    // Definition of graph lengths
    let margin = {top: 30, right: 0, bottom: 20, left: 0}
    let selectionWidth = +rawWidth() - 25
    let selectionHeight = +rawHeight() - margin.top - margin.bottom
    let borderGraph = selectionHeight / 18
    let graphWidth = selectionWidth - 4 * borderGraph
    let graphHeight = selectionHeight - 4 * borderGraph
    let widthFirstArc = graphWidth / 3
    let widthMiddleArcs = graphWidth / 4
    let radiusCircleElement = selectionWidth / 45

    selection
      .attr("width", selectionWidth + margin.left + margin.right)
      .attr("height", selectionHeight + margin.bottom + margin.top)
      .style("margin-left", -margin.left + "px")
      .style("margin.right", -margin.right + "px")

    let svgGraph = selection.append('svg')
      .attr('class', 'graph')
      .attr('width', selectionWidth)
      .attr('height', selectionHeight)

    /* Define x axis */
    let xAxisSpace = svgGraph.selectAll('.xAxisSpace')
      .data([{
        x0:  borderGraph,
        width: graphWidth,
        y0: graphHeight + borderGraph,
        height: 3 * borderGraph,
        nameXAxis: dimX
      }])
      .enter()
      .append('g')
      .attr('class', 'xAxisSpace')

    let defsX = xAxisSpace.append('defs')

    defsX.append("marker")
      .attr('id', 'arrow')
      .attr("refX", 0)
      .attr("refY", 3)
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("markerUnits", 'strokeWidth')
      .attr("orient", "auto")
      .append('path')
      .attr('d', "M0,0 L0,6 L9,3 z")
      .attr('fill', 'black')
      .attr('class', 'arrowHead')

    xAxisSpace.append('line')
      .attr("class", "arrow")
      .attr("x1", 2 * borderGraph + graphWidth)
      .attr("x2", 2 * borderGraph + 10)
      .attr("y1", 1.5 * borderGraph + graphHeight)
      .attr("y2", 1.5 * borderGraph + graphHeight)
      .style("marker-end", "url(#arrow)")
      .style('stroke', 'black')

    // Append name of x axis
    xAxisSpace.append('text')
      .attr('x', d => d.x0 + d.width / 2)
      .attr('y', d => d.y0 + d.height / 5)
      .attr('dy', '.75em')
      .html(nameDimX.replace(/([a-z](?=[A-Z]))/g, '$1 \n'))
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')

    /* Define y axis */
    let yAxisSpace = svgGraph.selectAll('.yAxisSpace')
      .data([{
        x0:  0,
        width: 2 * borderGraph,
        y0: borderGraph,
        height: 2 * borderGraph + graphHeight,
        nameYAxis: dimY
      }])
      .enter()
      .append('g')
      .attr('class', 'yAxisSpace')

    let defsY = yAxisSpace.append('defs')

    defsY.append("marker")
      .attr('id', 'arrow')
      .attr("refX", 0)
      .attr("refY", 3)
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("markerUnits", 'strokeWidth')
      .attr("orient", "auto")
      .append('path')
      .attr('d', "M0,0 L0,6 L9,3 z")
      .attr('fill', 'black')
      .attr('class', 'arrowHead')

    yAxisSpace.append('line')
      .attr("class", "arrow")
      .attr("x1", borderGraph)
      .attr("x2", borderGraph)
      .attr("y1", borderGraph + graphHeight)
      .attr("y2", borderGraph + 10)
      .style("marker-end", "url(#arrow)")
      .style('stroke', 'black')

    // Append name of y axis
    yAxisSpace.append('text')
      .attr('x', d => d.x0 + d.width / 2)
      .attr('y', d => d.y0 + d.height / 2)
      .attr('dy', '.75em')
      .html(nameDimY.replace(/([a-z](?=[A-Z]))/g, '$1 \n'))
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')

    /* Create quarter of arcs */
    let arcsSpace = svgGraph.append('g')
      .attr('transform', 'translate(' + 2 * borderGraph + ',' + borderGraph + ')')
      .attr('class', 'arcsSpace')

    arcsSpace.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', graphWidth)
      .attr('height', graphHeight)
      .style('stroke', 'black')
      .style('stroke-width', '1px')
      .style('fill-opacity', '0')

    let currentRadius = 0
    nameQuarterArcs.forEach((nameArc, i, arcsArray) => {

      let currentWidth = (i === 0) ? widthFirstArc : widthMiddleArcs
      let arc = d3.arc()
        .innerRadius(currentRadius)
        .outerRadius(currentRadius + currentWidth)
        .startAngle(Math.PI / 2)
        .endAngle(Math.PI)

      if (i !== arcsArray.length - 1) {
        // Create and append arc
        arcsSpace.append("path")
          .attr('d', arc)
          .style('fill', () => {
            return pickHex(i / arcsArray.length,
              {red: 204, green: 230, blue: 255},
              {red: 102, green: 181, blue: 255})
          })
      }

      svgGraph.append('text')
        .attr('x', () => currentRadius)
        .attr('y', 0)
        .attr('dy', '.75em')
        .text(nameArc)
        .attr('transform', 'translate(' + 2 * borderGraph +',' + (borderGraph - 20) + ')')
        .attr('text-anchor', 'left')
        .attr('alignment-baseline', 'middle')

      currentRadius += currentWidth
    })

    /* Append size scale */
    if (nameDimSizeElements) {
      let sizeScaleSpace = arcsSpace.selectAll('.sizeScaleSpace')
        .data([{x: graphHeight / 16,
          y: graphHeight - 3/2 * borderGraph,
          width: graphWidth / 4,
          height: borderGraph
        }])
        .enter()
        .append('g')
        .attr('class', 'sizeScaleSpace')

      // Circles of different radius
      let currentX = graphHeight / 16
      let currentY = graphHeight - borderGraph /2
      for (let j=0; j<4; j++) {

        currentX += 2 + (j + 1) * 0.25 * radiusCircleElement + (j) * 0.25 * radiusCircleElement

        sizeScaleSpace.append('circle')
          .attr('cx', d => currentX )
          .attr('cy', d => currentY)
          .attr('r', d => (j + 1) * 0.25 * radiusCircleElement)
          .style('fill', 'grey')
      }

      let defsSizeScale = sizeScaleSpace.append('defs')

      defsSizeScale.append("marker")
        .attr('id', 'arrow')
        .attr("refX", 0)
        .attr("refY", 3)
        .attr("markerWidth", 10)
        .attr("markerHeight", 10)
        .attr("markerUnits", 'strokeWidth')
        .attr("orient", "auto")
        .append('path')
        .attr('d', "M0,0 L0,6 L9,3 z")
        .attr('fill', 'black')
        .attr('class', 'arrowHead')

      sizeScaleSpace.append('line')
        .attr("class", "arrow")
        .attr("x2", currentX +4 * 0.25 * radiusCircleElement )
        .attr("y1", graphWidth - (5 / 3) * borderGraph)
        .attr("x1", graphWidth / 16 - 0.3 * radiusCircleElement)
        .attr("y2", graphWidth - (5 / 3) * borderGraph)
        .style("marker-end", "url(#arrow)")
        .style('stroke', 'black')

      sizeScaleSpace.append('text')
        .text(nameDimSizeElements.replace(/([a-z](?=[A-Z]))/g, '$1 '))
        .attr('x', d => d.x + (currentX - d.x) / 2)
        .attr('y', d => d.y)
        .attr('dy', '.75em')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'bottom')
    }

    /* Create scatterplot */
    // setup x scale
    let xScale = d3.scaleLinear().domain([1,0]).range([2 * radiusCircleElement + 2, graphWidth - 2 * radiusCircleElement - 2])

    // setup y
    let yScale = d3.scaleLinear().domain([1,0]).range([2 * radiusCircleElement + 2, graphHeight - 2 * radiusCircleElement - 2])

    // Map the basic node data to d3-friendly format.
    let nodesElements = data.map((node) => {
      let nodeX = xScale(parseFloat(node[dimX]))
      let nodeY = yScale(parseFloat(node[dimY]))
      return {
        x: nodeX,
        y: nodeY,
        nameElement: node[dimNameElements],
        sizeElement: (nameDimSizeElements)?parseFloat(node[dimSizeElements]):0.5,
        colorElement: (nameDimColorElements)?node[dimColorElements]:0.5
      };
    });

    /* Create a force simulation to avoid circles overlapping */
    let simulation = d3.forceSimulation(nodesElements)
      .force("x", d3.forceX(function(d) { return d.x }))
      .force("y", d3.forceY(function(d) { return d.y }))
      .force("collide", d3.forceCollide().radius((d) => (d.sizeElement + 0.1) * radiusCircleElement))
      .force("manyBody", d3.forceManyBody().strength(-10))
      .stop();

    for (var i = 0; i < 200; ++i) simulation.tick()

    /* Draw dataset elements to the graph on the arcs and make them draggable */
    // Create color domain
    colors.domain(nodesElements, d => {
      return d.colorElement
    })

    let drag = d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended)

    let elementSpace = arcsSpace.selectAll('.elementSpace')
      .data(nodesElements)
      .enter().append('g')
      .attr("class", "elementSpace")

    elementSpace.append('circle')
      .attr("r", d => (d.sizeElement + 0.1) * radiusCircleElement)
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .style("fill", d => colors() ? colors()(d.colorElement) : "grey")
      .call(drag)

    elementSpace.append('text')
      .text(el => el.nameElement)
      .attr('x', el => el.x + (el.sizeElement + 0.3) * radiusCircleElement)
      .attr('y', el => el.y)
      .attr('dy', '.1em')
      .attr('text-anchor', 'left')
      .attr('alignment-baseline', 'middle')
      .attr('class', 'labelCircle')
      .attr('transform', 'translate(0, 0)')
      .style('pointer-events', 'auto')
      .call(drag)

      // Implementation of drag
      function dragstarted(d) {
      d3.select(this).raise().classed("active", true);
    }

    function dragged(d) {
      d3.select(this)
        .attr("cx", d.x = d3.event.x)
        .attr("cy", d.y = d3.event.y)
        .attr("x", d.x = d3.event.x)
        .attr("y", d.y = d3.event.y)
    }

    function dragended(d) {
      d3.select(this).classed("active", false);
    }

    // Avoid label overlaping
    arrangeLabels('.labelCircle')

    /* function that returns a color over a radient depending on the weight (between 0 and 1) */
    function pickHex(weight, color1, color2) {
      let w1 = weight;
      let w2 = 1 - w1;
      let rgb = [Math.round(color1.red * w1 + color2.red * w2),
        Math.round(color1.green * w1 + color2.green * w2),
        Math.round(color1.blue * w1 + color2.blue * w2)];
      return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
    }

    function arrangeLabels(classLabel) {
      var move = 1;
      while(move > 0) {
        move = 0;
        elementSpace.selectAll(classLabel)
          .each(function() {
            var that = this,
              a = this.getBoundingClientRect();
            elementSpace.selectAll(classLabel)
              .each(function() {
                if(this != that) {
                  var b = this.getBoundingClientRect();
                  if((Math.abs(a.left - b.left) * 2 < (a.width + b.width)) &&
                    (Math.abs(a.top - b.top) * 2 < (a.height + b.height))) {
                    // overlap, move labels
                    var dx = (Math.max(0, a.right - b.left) +
                      Math.min(0, a.left - b.right)) * 0.01,
                      dy = (Math.max(0, a.bottom - b.top) +
                        Math.min(0, a.top - b.bottom)) * 0.02,
                      tt = d3.select(this).attr("transform"),
                      to = d3.select(that).attr("transform");
                    move += Math.abs(dx) + Math.abs(dy);

                    let translateT = tt.substring(tt.indexOf("(")+1, tt.indexOf(")")).split(",")
                    let translateO = to.substring(to.indexOf("(")+1, to.indexOf(")")).split(",")

                    translateO = [ parseFloat(translateO[0]) + dx, parseFloat(translateO[1]) + dy ];
                    translateT = [ translateT[0] - dx, translateT[1] - dy ];
                    d3.select(this).attr("transform", "translate(" + translateO[0] + ',' + translateO[1] + ")");
                    d3.select(that).attr("transform", "translate(" + translateT[0] + ',' + translateT[1] + ")");
                    a = this.getBoundingClientRect();
                  }
                }
              });
          });
      }
    }
  })
})()