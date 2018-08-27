(function(){

  let tree = raw.models.custom
  Tree();

  let chart = raw.chart()
    .title('Zoomable Treemap')
    .description(
      "A space filling visualization of data hierarchies and proportion between elements. The different hierarchical levels create visual clusters through the subdivision into rectangles proportionally to each element's value. Treemaps are useful to represent the different proportion of nested hierarchical data structures.<br/>Based on <a href='http://bl.ocks.org/mbostock/4063582'>http://bl.ocks.org/mbostock/4063582</a>")
    .thumbnail("/raw/imgs/treemap.png")
    .category('Hierarchies')
    .model(tree)

  let rawWidth = chart.number()
    .title('Width')
    .defaultValue(100)
    .fitToWidth(true)

  let rawHeight = chart.number()
    .title("Height")
    .defaultValue(500)

  let colors = chart.color()
    .title("Color scale")

  // Function used each time columns are put in dimensions on RAWGraphs
  chart.draw(function (selection, data){
    data.name = 'Zoomable Tree'
    let rawData = tree.getData()
    let columnsDimensions = tree.nameColumnsInDimension()
    let treeDepth = columnsDimensions.hierarchy.length
    let insideElementsNames = columnsDimensions.insideElements
    let insideColorElementsNames = columnsDimensions.colorInsideElements
    let colorValues = []

    if (!(insideColorElementsNames == null)) {
      insideColorElementsNames.forEach(function (name) {
        colorValues.push(rawData.map(el => el[name]))
      })
    }

    let margin = {top: 30, right: 0, bottom: 20, left: 0},
      width =  +rawWidth() - 25,
      height = +rawHeight() - margin.top - margin.bottom,
      transitioning;

    // sets x and y scale to determine size of visible boxes
    let x = d3.scaleLinear()
      .domain([0, width])
      .range([0, width]);

    let y = d3.scaleLinear()
      .domain([0, height])
      .range([0, height]);

    let treemap = d3.treemap()
      .tile(d3.treemapResquarify) // possible values : d3.treemapSlice ou d3.treempaSlice ou d3.treemapSliceDice
      .size([width, height])
      .padding(0)

    let svg = selection
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.bottom + margin.top)
      .style("margin-left", -margin.left + "px")
      .style("margin.right", -margin.right + "px")
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .style("shape-rendering", "crispEdges");

    let grandparent = svg.append("g")
      .attr("class", "grandparent");

    grandparent.append("rect")
      .attr("y", -margin.top)
      .attr("width", width)
      .attr("height", margin.top)

    grandparent.append("text")
      .attr("x", 6)
      .attr("y", 6 - margin.top)
  .attr("dy", '0.75em');

    let root = d3.hierarchy(data);
    console.log('data', data)
    console.log('hierarchy', root)
    treemap(root
      .sum(function(d) { return +d.size; })
    );
    display(root);

    function display(d) {
      // write text into grandparent
      // and activate click's handler
      grandparent
        .datum(d.parent)
        .on("click", transition)
        .select("text")
        .text(breadcrumbs(d));

      // grandparent color
      grandparent
        .datum(d.parent)
        .select("rect")
        .style("fill", function () {
          return '#ff9933'
        })
        .style("fill-opacity", .7)
        .style('stroke', 'white')
        .style('stroke-width', '2px')
        .on("mouseover", function () {
          d3.select(this).style("fill-opacity", 1);
        })
        .on("mouseout", function () {
          d3.select(this).style("fill-opacity", .7);
        })
      ;

      let g1 = svg.insert("g", ".grandparent")
        .datum(d)
        .attr("class", "depth");

      let g = g1.selectAll("g")
        .data(d.children)
        .enter()
        .append("g");

      // add class and click handler to all g's with children
      g.filter(function (d) {
        return d.children;
      })
        .attr("class", "children")
        .style("cursor", "pointer")
        .on("click", transition);

      // Create rectangle for all children
      g.selectAll(".child")
        .data(function (d) {
          return d.children || [d];
        })
        .enter()
        .append("rect")
        .attr("class", "child")
        .style("stroke-width", "2px")
        .style("stroke", "white")
        .call(rect);

      // Create and customize parent rectangles
      g.append("rect")
        .attr("class", "parent")
        .on("mouseover", function (d) {
          if (d.depth !== treeDepth) {
            d3.select(this).style("fill-opacity", 1);
          }
        })
        .on("mouseout", function (d) {
          if (d.depth !== treeDepth) {
            d3.select(this).style("fill-opacity", .5);
          }
        })
        .call(rect)
        .style("fill", '#3399ff')
        .style("fill-opacity", .5)
        .style("stroke", 'white')
        .style("stroke-width", '2px')
        .append("title")
        .text(function (d){
          return name(d);
        });

        g.append('svg')
        .attr('class', 'foreignobj')
        .append('text')
        .attr('x', d => d.x0)
        .attr('y', d => d.y0)
        .attr('dy', '0.75em')
        .text(d => d.data.name)
        .attr("class", "textdiv"); //textdiv class allows us to style the text easily with CSS

        // Create rectangle for all children who have no children to put inside elements
        console.log('a', d)
        if (d.depth === treeDepth - 1 && !(insideElementsNames == null)) {
          console.log('b', d)
        let selectionInsideElements = g1.selectAll("g")
          .insert('g', 'foreignObject')
          .data(function (d) {
            return d.children
          })
          .attr('class', 'insideElements')

        let selectionRectInsideElements = selectionInsideElements.selectAll('.insideElements')
          .data(function (d) {
            console.log('inside', d)
            return d.data.insideElements.map((el, i) => {
              // Position of each inside element and text, and its name
              return {
                nameInsideElement: el,
                colorInsideElement: (insideColorElementsNames == null)?'#4332ff':pickHex(d.data.colorInsideElements[i],
                  {red:0, green: 255, blue: 0},
                  {red:255, green: 0, blue: 0}),
                x0: d.x0 + i * (d.x1 - d.x0) / d.data.insideElements.length + 3,
                x1: d.x0 + (i + 1) * (d.x1 - d.x0) / d.data.insideElements.length - 3,
                y0: d.y0 + (1 / 3) * (d.y1 - d.y0),
                y1: d.y1 - 5,
                x: d.x0 + i * (d.x1 - d.x0) / d.data.insideElements.length + 3,
                y: (d.y0 + (1 / 3) * (d.y1 - d.y0)) + (5/100) * (d.y1 - 5 - (d.y0 + (1 / 3) * (d.y1 - d.y0)))
              }
            })
          })
          .enter()

        selectionRectInsideElements.append("rect")
          .attr("class", "rectInsideElement")
          .style("fill", function (d) {
            return d.colorInsideElement
          })
          .style('stroke', 'white')

        selectionRectInsideElements.append("text")
          .text(function (d) {
            return nameInsideElement(d)
          })
          .attr('dy', function (d) { return '.95em'})
          .attr('class', 'insideName')
      }

      function transition(d) {
        if (transitioning || !d) return;
        transitioning = true;
        let g2 = display(d),
          t1 = g1.transition().duration(650),
          t2 = g2.transition().duration(650);

        // Update the domain only after entering new elements.
        x.domain([d.x0, d.x1]);
        y.domain([d.y0, d.y1]);

        // Enable anti-aliasing during the transition.
        svg.style("shape-rendering", null);

        // Draw child nodes on top of parent nodes.
        svg.selectAll(".depth").sort(function (a, b) {
          return a.depth - b.depth;
        });

        // Fade-in entering text.
        g2.selectAll("text").style("fill-opacity", 0);
        g2.selectAll("foreignObject div").style("display", "none");

        /*added*/
        // Transition to the new view.
        t1.selectAll("text:not(.insideName)").call(text).style("fill-opacity", 0);
        t2.selectAll("text:not(.insideName)").call(text).style("fill-opacity", 1);
        t1.selectAll("rect:not(.insideElement)").call(rect);
        t2.selectAll("rect:not(.insideElement)").call(rect);
        t1.selectAll('.rectInsideElement')
          .call(rect);
        t2.selectAll('.rectInsideElement')
          .call(rect);
        t1.selectAll('.insideName')
          .style("fill-opacity", 0)
          .each(function () {
            let selectedText = d3.select(this)
            text(selectedText);
          })

        t1.selectAll('.insideName')
          .call(wrap);

        t2.selectAll('.insideName')
          .style("fill-opacity", 1)
          .each(function () {
            let selectedText = d3.select(this)
            text(selectedText);
          })

        t2.selectAll('.insideName')
          .call(wrap);

        /* Foreign object */
        t1.selectAll(".textdiv").style("display", "none");
        /* added */
        t1.selectAll(".foreignobj").call(foreign);
        /* added */
        t2.selectAll(".textdiv").style("display", "block");
        /* added */
        t2.selectAll(".foreignobj").call(foreign);
        /* added */
        // Remove the old node when the transition is finished.
        t1.on("end.remove", function(){
          this.remove();
          transitioning = false;
        });
      }
      return g;
    }

    function text(text) {
      text.attr("x", function (d) {
        return x(d.x) + 6;
      })
        .attr("y", function (d) {
          return y(d.y) + 6;
        })
        .attr('width', function (d) {
          return x(d.x1) - x(d.x0)
        });
    }

    function rect(rect) {
      rect
        .attr("x", function (d) {
          return x(d.x0);
        })
        .attr("y", function (d) {
          return y(d.y0);
        })
        .attr("width", function (d) {
          return x(d.x1) - x(d.x0);
        })
        .attr("height", function (d) {
          return y(d.y1) - y(d.y0);
        })
    }

    function foreign(foreign) { /* added */
      foreign
        .attr("x", function (d) {
          return x(d.x0);
        })
        .attr("y", function (d) {
          return y(d.y0);
        })
        .attr("width", function (d) {
          return x(d.x1) - x(d.x0);
        })
        .attr("height", function (d) {
          return y(d.y1) - y(d.y0);
        });
    }

    function name(d) {
      return d.data.name;
    }

    // Return the name of the ith inside element
    function nameInsideElement (d) {
      return d.nameInsideElement;
    }

    function breadcrumbs(d) {
      let res = "";
      let sep = " > ";
      d.ancestors().reverse().forEach(function(i){
        res += name(i) + sep;
      });
      res = res
        .split(sep)
        .filter(function(i){
          return i!== "";
        })
        .join(sep);
      return res +
        (d.parent
          ? " -  Click to zoom out"
          : " - Click inside square to zoom in");
    }

    // function that returns a color over a radient depending on the weight (between 0 and 1)
    function pickHex(weight, color1, color2) {
      let w1 = weight;
      let w2 = 1 - w1;
      let rgb = [Math.round(color1.red * w1 + color2.red * w2),
        Math.round(color1.green * w1 + color2.green * w2),
        Math.round(color1.blue * w1 + color2.blue * w2)];
      return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
    }

    // Wraps text so that text is on multiple lines if ever bigger than container
    function wrap(selectedText) {
      selectedText
        .each(function () {
        let text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1, // ems
          y = text.attr("y"),
          x = text.attr("x"),
          width = text.attr('width'),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width - 5) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          }
        }
      })
    }
  })
})();