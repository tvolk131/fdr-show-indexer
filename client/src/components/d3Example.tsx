import * as React from 'react';
import {useEffect} from 'react';
import * as d3 from 'd3';

const width = 932;
const radius = width / 6;

const data = {
  name: 'flare',
  children: [
    {
      name: 'analytics',
      children: [
        {name: 'cluster'},
        {name: 'graph'},
        {name: 'optimization'}
      ]
    },
    {name: 'animate'},
    {name: 'data'},
    {name: 'display'},
    {name: 'flex'},
    {name: 'physics'},
    {name: 'query'},
    {name: 'scale'}
  ]
};

const labelVisible = (d: any) => {
  return d && d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
}

const labelTransform = (d: any) => {
  if (!d) {
    return '';
  }
  const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
  const y = (d.y0 + d.y1) / 2 * radius;
  return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
}

const format = d3.format(",d");

export const D3Example = () => {
  useEffect(() => {
    const partition = (data: any) => {
      const root = d3.hierarchy(data)
          .sum(d => d.value)
          .sort((a, b) => b.value! - a.value!);
      return d3.partition()
          .size([2 * Math.PI, root.height + 1])
        (root);
    };

    const root = partition(data);

    const svg = d3
      .select('.target')
      .attr('viewBox', [0, 0, width, width].join(', '))
      .style('font', '10px sans-serif');

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${width / 2})`);

    const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1));

    const arcVisible = (d: any) => {
      return d && d.y1 !== undefined && d.y0 !== undefined && d.x1 !== undefined && d.y0 !== undefined && d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }

    const arc = d3.arc()
      .startAngle((d: any) => d?.x0)
      .endAngle((d: any) => d?.x1)
      .padAngle((d: any) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius((d: any) => d ? d.y0 * radius : 0)
      .outerRadius((d: any) => d ? Math.max(d.y0 * radius, d.y1 * radius - 1) : 0)

    const path = g.append('g')
      .selectAll('path')
      .data(root.descendants().slice(1))
      .join('path')
        .attr('fill', d => { while (d.depth > 1) d = d.parent!; return color((d.data as any).name); })
        .attr('fill-opacity', (d: any) => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
        .attr('d', (d: any) => arc(d.current));

    path.append("title")
      .text((d: any) => `${d.ancestors().map((d: any) => d.data.name).reverse().join("/")}\n${format(d.value)}`);

    const label = g.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
      .selectAll("text")
      .data(root.descendants().slice(1))
      .join("text")
      .attr("dy", "0.35em")
      .attr("fill-opacity", (d: any) => +labelVisible(d.current))
      .attr("transform", (d: any) => labelTransform(d.current))
      .text((d: any) => d.data.name);

    const parent = g.append("circle")
      .datum(root)
      .attr("r", radius)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("click", clicked);

    function clicked(event: any, p: any) {
      parent.datum(p.parent || root);
  
      root.each((d: any) => d.target = {
        x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        y0: Math.max(0, d.y0 - p.depth),
        y1: Math.max(0, d.y1 - p.depth)
      });
  
      const t = g.transition().duration(750);
  
      // Transition the data on all arcs, even the ones that aren’t visible,
      // so that if this transition is interrupted, entering arcs will start
      // the next transition from the desired position.
      path.transition(t as any)
        .tween("data", (d: any) => {
          const i = d3.interpolate(d.current, d.target);
          return (t: any) => d.current = i(t);
        })
        .filter(function(d: any) {
          if (this instanceof SVGPathElement) {
            return (+this.getAttribute("fill-opacity")!) > 0 || arcVisible(d.target);
          } else {
            throw Error('Whoa, oh no!');
          }
        })
        .attr("fill-opacity", (d: any) => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
        .attrTween("d", (d: any) => () => (arc as any)(d.current));
  
      label.filter(function(d: any) {
        if (this instanceof SVGTextElement) {
          return (+this.getAttribute("fill-opacity")!) > 0 || labelVisible(d.target);
        } else {
          throw Error('Uh oh!');
        }
      }).transition(t as any)
        .attr("fill-opacity", (d: any) => +labelVisible(d.target))
        .attrTween("transform", (d: any) => () => labelTransform(d.current));
    }

    path.filter((d: any) => d.children)
      .style("cursor", "pointer")
      .on("click", clicked);
  }, []);

  return (<svg className='target'/>);
}