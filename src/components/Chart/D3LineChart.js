import React, { useRef, useEffect, useState } from "react";
import { formatEther } from '@ethersproject/units'
import { useChain } from 'context/chain/ChainContext'
import {
  area,
  curve,
  extent,
  select,
  scaleLinear,
  line,
  max,
  curveCardinal,
  axisBottom,
  axisLeft,
  zoom,
  zoomTransform
} from "d3";
import { useResizeObserver } from "./utils";
import styled from "styled-components";


const StyledSVG = styled.svg`
    display: block;
    width: 100%;
    height: 400px;
    overflow: visible;
`

/**
 * Component that renders a ZoomableLineChart
 */

function ZoomableLineChart({ data, areaData, id = "myZoomableLineChart" }) {
  const svgRef = useRef();
  const wrapperRef = useRef();
  const dimensions = useResizeObserver(wrapperRef);
  const [currentZoomState, setCurrentZoomState] = useState();
  var margin = {top: 20, right: 20, bottom: 40, left: 80}
  const { supplyNOM } = useChain()

  // will be called initially and on every data change
  useEffect(() => {
    
    const svg = select(svgRef.current);
    const svgContent = svg.select(".content");

    const { width, height } =
      dimensions || wrapperRef.current.getBoundingClientRect();

    function xValue(d) { return d.x; }      // accessors
    function yValue(d) { return d.y; }

    // scales + line generator
    const xScale = scaleLinear()
      .domain(extent(data, xValue))
      .range([margin.left, width - margin.right]);

    if (currentZoomState) {
      const newXScale = currentZoomState.rescaleX(xScale);
      xScale.domain(newXScale.domain());
    }

    const yScale = scaleLinear()
      .domain(extent(data, yValue))
      .range([height - margin.top - margin.bottom, 10]);

    // Temporary
    if (currentZoomState) {
        const newYScale = currentZoomState.rescaleY(yScale);
        yScale.domain(newYScale.domain());
    }
    
    var lineGenerator = line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y)) // apply the y scale to the y data
      .curve(curveCardinal);

    var areaGenerator = area()
      .x(d => xScale(d.x))
      .y0(yScale(0))
      .y1(d => yScale(d.y))
      .curve(curveCardinal)

    // render the line
    svgContent
      .selectAll(".myLine")
      .data([data])
      .join("path")
      .attr("class", "myLine")
      .attr("stroke", "black")
      .attr("fill", "none")
      .attr("d", lineGenerator);
    
    svgContent
      .selectAll(".mySelection")
      .data([areaData])
      .join("path")
      .attr("class", "mySelection")
      .attr("stroke", "black")
      .attr("fill", "#0e4265")
      .attr("d", areaGenerator)
    

    // axes
    const xAxis = axisBottom(xScale);
    svg
      .select(".x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom - margin.top})`)
      .call(xAxis);

    // Add X axis label:
    svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", width)
      .attr("y", height)
      .text("NOM Issued");

    const yAxis = axisLeft(yScale);
    svg
      .select(".y-axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(yAxis);
    
    // Y axis label:
    svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", 0)
    .attr("x", -margin.top)
    .text("Price (ETH/NOM)")


    // zoom
    const zoomBehavior = zoom()
      .scaleExtent([0.5, 5])
      .translateExtent([
        [0, 0],
        [width, height]
      ])
      .on("zoom", () => {
        const zoomState = zoomTransform(svg.node());
        setCurrentZoomState(zoomState);
      });

    svg.call(zoomBehavior);
  }, [currentZoomState, data, dimensions]);

  return (
    <React.Fragment>
      { !supplyNOM ? null : `Current Supply: ${formatEther(supplyNOM)}` }
      <div ref={wrapperRef} style={{ marginTop: "1rem" }}>
        <StyledSVG ref={svgRef}>
          <defs>
            <clipPath id={id}>
              <rect x="0" y="0" width="100%" height="100%" />
            </clipPath>
          </defs>
          <g className="content" clipPath={`url(#${id})`}>
            
          </g>
          <g className="x-axis" />
          <g className="y-axis" />
        </StyledSVG>
      </div>
    </React.Fragment>
  );
}

export default ZoomableLineChart;