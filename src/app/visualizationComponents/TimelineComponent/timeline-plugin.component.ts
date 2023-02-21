import { Component, EventEmitter, Output, Injector, OnInit, OnDestroy } from '@angular/core';
import { CommonService } from '../../contactTraceCommonServices/common.service';
import * as d3 from 'd3';
import moment from 'moment';

import { MicrobeTraceNextVisuals } from '../../microbe-trace-next-plugin-visuals';
import { AppComponentBase } from '@shared/common/app-component-base';
import { MicobeTraceNextPluginEvents } from '@app/helperClasses/interfaces';


/**
 * @title Complex Example
 */
@Component({
    selector: 'TimelineComponent',
    templateUrl: './timeline-plugin.component.html',
})
export class TimelineComponent extends AppComponentBase implements OnInit, MicobeTraceNextPluginEvents, OnDestroy{

    @Output() DisplayGlobalSettingsDialogEvent = new EventEmitter();

    settings: any = this.commonService.session.style.widgets;
    public visuals: MicrobeTraceNextVisuals;


    constructor(injector: Injector, public commonService: CommonService) {

        super(injector);

        this.visuals = commonService.visuals;
        this.commonService.visuals.timeline = this;
    }
    updateNodeColors() {
        throw new Error('Method not implemented.');
    }
    updateVisualization() {
        throw new Error('Method not implemented.');
    }
    updateLinkColor() {
        throw new Error('Method not implemented.');
    }
    openRefreshScreen() {
        throw new Error('Method not implemented.');
    }
    onRecallSession() {
        throw new Error('Method not implemented.');
    }
    onLoadNewData() {
        throw new Error('Method not implemented.');
    }
    onFilterDataChange() {
        throw new Error('Method not implemented.');
    }
    openExport() {
        throw new Error('Method not implemented.');
    }


    ngOnInit() {
        this.commonService.updateNetwork();
    }

    ngOnDestroy(): void {
        //this.context.twoD.commonService.session.style.widgets['node-label-variable'] = 'None';
    }


    public width = 0;
    public height = 0;
    public middle = 0;
    public svg;
    public timeDomainStart;
    public timeDomainEnd;
    public x;
    public y;
    public histogram;
    public brush;
    public brushG;
    public selection;
    public timer;
    public tick = 0;

    public isPlaying = false;

    public margin = { top: 50, left: 20, right: 20, bottom: 30 };

    public refresh() {
    var wrapper = $("#timeline").empty().parent();
    var tickFormat = d3.timeFormat("%Y-%m-%d");
    this.width = wrapper.width() - this.margin.left - this.margin.right;
    this.height = wrapper.height() - this.margin.top - this.margin.bottom;
    this.middle = this.height / 2;

    var field = $("#timeline-date-field").val() as string;
    var times = [],
        vnodes = JSON.parse(JSON.stringify(this.visuals.microbeTrace.commonService.session.data.nodes));
    vnodes.forEach(d => {
        var time = moment(d[field]);
        if (time.isValid()) {
        d[field] = time.toDate();
        times.push(d[field]);
        } else {
        d[field] = null;
        }
    });
    if (times.length < 2) {
        times = [new Date(2000, 1, 1), new Date()];
    }
    this.timeDomainStart = Math.min(...times);
    this.timeDomainEnd = Math.max(...times);

    this.x = d3
        .scaleTime()
        .domain([this.timeDomainStart, this.timeDomainEnd])
        .rangeRound([0, this.width]);

        this.y = d3.scaleLinear().range([this.height, 0]);

        this.histogram = d3
        .histogram()
        .value(d => d[field])
        .domain(this.x.domain())
        .thresholds(d3.thresholdScott); 
        // .thresholds(d3.thresholdFreedmanDiaconis);  #205

        this.svg = d3
        .select("#timeline")
        .append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom);

    var epiCurve = this.svg
        .append("g")
        .classed("timeline-epi-curve", true)
        .attr("transform", "translate(" + this.margin.left + ",0)");

    var bins = this.histogram(vnodes);

    if (!this.visuals.microbeTrace.commonService.session.style.widgets["timeline-noncumulative"]) {
        var sum = 0;
        bins.forEach(bin => {
        sum += bin.length;
        bin.length = sum;
        });
    }

    // Scale the range of the data in the y domain
    this.y.domain([0, d3.max(bins, d => d.length)]);

    // append the bar rectangles to the svg element
    epiCurve
        .selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("transform", d => `translate(${this.x(d.x0)},${this.y(d.length)})`)
        .attr("width", d => this.x(d.x1) - this.x(d.x0))
        .attr("height", d => this.height - this.y(d.length))
        .attr("fill", this.visuals.microbeTrace.commonService.session.style.widgets["node-color"]);

        this.svg
        .append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(" + this.margin.left + "," + this.height + ")")
        .call(
        d3
            .axisBottom(this.x)
            .tickSize(8)
            .tickPadding(8)
            .tickFormat(tickFormat)
        )
        .attr("text-anchor", null)
        .selectAll("text")
        .attr("x", 6);

        this.brush = d3
        .brushX()
        .extent([[0, 0], [this.width, this.height]])
        .on("start brush", function () {
        this.selection = d3.brushSelection(this.brushG.node());
        if (!this.selection) return;
        if (this.selection[0] > 0) {
            this.selection[0] = 0;
            this.brushG.call(this.brush.move, this.selection);
        }
        })
        .on("end", function () {
            this.selection = d3.brushSelection(this.brushG.node());
        if (!this.selection) return;
        if (this.selection[0] > 0) {
            this.selection[0] = 0;
            this.brushG.call(this.brush.move, this.selection);
            // propagate();
        }
        });

        this.brushG = this.svg
        .append("g")
        .attr("class", "brush")
        .attr("transform", "translate(" + this.margin.left + ",0)")
        .call(this.brush);
    }

    // $("#timeline-play").click( () {
    // var $this = $(this);
    // if (this.isPlaying) {
    //     $this.html('<span class="oi oi-media-play"></span>');
    //     this.timer.stop();
    //     this.isPlaying = false;
    // } else {
    //     $this.html('<span class="oi oi-media-pause"></span>');
    //     this.isPlaying = true;
    //     setTimer();
    // }
    // });

    // function setTimer() {
    // if (this.timer) {
    //     this.timer.stop();
    //     d3.timerFlush();
    // }
    // this.timer = d3.interval(function () {
    //     var selection = d3.brushSelection(this.brushG.node());
    //     if (!selection) return this.timer.stop(); // Ignore empty selections
    //     if (selection[1] >= this.width) {
    //     $("#timeline-play").click();
    //     return;
    //     }
    //     this.brushG.call(this.brush.move, selection.map(s => s + 1));
    //     if(++this.tick % 5 == 0) propagate();
    // }, 110 - parseInt($("#timeline-speed").val() as string));
    // if (!this.isPlaying) this.timer.stop();
    // }

    // function propagate(){
    //     this.visuals.microbeTrace.commonService.session.state.timeStart = this.x.invert(this.selection[0]);
    //     this.visuals.microbeTrace.commonService.session.state.timeEnd = this.x.invert(this.selection[1]);
    //     this.visuals.microbeTrace.commonService.setNodeVisibility(true);
    //     this.visuals.microbeTrace.commonService.setLinkVisibility(true);
    //     this.visuals.microbeTrace.commonService.tagClusters().then(() => {
    //     ["node", "link"].forEach(function (thing) {
    //         $(document).trigger(thing + "-visibility");
    //     });
    // });
    // }

    // $("#timeline-toggle-settings")
    // .click(function () {
    //     var pane = $("#timeline-settings-pane");
    //     if ($(this).hasClass('active')) {
    //     pane.animate({ left: "-400px" }, function () {
    //         pane.hide();
    //     });
    //     } else {
    //     pane.show(0, function () {
    //         pane.animate({ left: "0px" });
    //     });
    //     }
    // })
    // .trigger("click");

    // $("#timeline-date-field").on("change", function () {
    //     this.visuals.microbeTrace.commonService.session.style.widgets["timeline-date-field"] = this.value;
    // this.refresh();
    // });

    // $('[name="timeline-cumulation"]').on("change", function () {
    //     this.visuals.microbeTrace.commonService.session.style.widgets["timeline-noncumulative"] =
    //     $("#timeline-noncumulative").is(":checked");
    //     this.refresh();
    // });

    // $(document).on("node-color-change", function () {
    //     this.svg
    //     .select(".timeline-epi-curve")
    //     .selectAll("rect")
    //     .attr("fill", this.visuals.microbeTrace.commonService.session.style.widgets["node-color"]);
    // });

    // $("#timeline-speed").on("change", setTimer);

    // this.layout.on("stateChanged", refresh);
}
