import { Injector, Component, Output, OnChanges, SimpleChange, EventEmitter, OnInit, ViewChild, ElementRef, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { EventManager, DOCUMENT } from '@angular/platform-browser';
import { CommonService } from '../../contactTraceCommonServices/common.service';
import { window } from 'ngx-bootstrap';
import * as d3 from 'd3';
import { forceAttract } from 'd3-force-attract'
import * as ClipboardJS from 'clipboard';
import * as saveAs from 'file-saver';
import * as domToImage from 'dom-to-image-more';
import { SelectItem } from 'primeng/api';
import { DialogSettings } from '../../helperClasses/dialogSettings';
import { MicobeTraceNextPluginEvents } from '../../helperClasses/interfaces';
import * as _ from 'lodash';
import { MicrobeTraceNextVisuals } from '../../microbe-trace-next-plugin-visuals';
import { CustomShapes } from '@app/helperClasses/customShapes';

@Component({
    selector: 'TwoDComponent',
    templateUrl: './twoD-plugin.component.html',
    styleUrls: ['./twoD-plugin.component.scss']
})
export class TwoDComponent extends AppComponentBase implements OnInit, MicobeTraceNextPluginEvents, OnDestroy {

    @Output() DisplayGlobalSettingsDialogEvent = new EventEmitter();

    svgStyle: {} = {
        'height': '0px',
        'width': '1000px'
    };

    private customShapes : CustomShapes = new CustomShapes();

    ShowNetworkAttributes: boolean = false;
    ShowStatistics: boolean = true;
    Show2DExportPane: boolean = false;
    Show2DSettingsPane: boolean = false;
    IsDataAvailable: boolean = false;
    svg: any = null;
    settings: any = this.commonService.session.style.widgets;
    halfWidth: any = null;
    halfHeight: any = null;
    transform: any = null;
    force: any = null;
    radToDeg: any = (180 / Math.PI);
    selected: any = null;
    multidrag: boolean = false;
    // clipboard = new ClipboardJS('#copyID, #copySeq');
    zoom: any = null;
    brush: any = null;
    FieldList: SelectItem[] = [];
    ToolTipFieldList: SelectItem[] = [];
    
    //Polygon Tab
    SelectedPolygonLabelVariable: string = "None";
    SelectedPolygonColorVariable: string = "None";
    SelectedPolygonLabelOrientationVariable: string = "Right";
    SelectedPolygonLabelSizeVariable: number = 0.0;
    SelectedPolygonGatherValue: number = 0.0;
    CenterPolygonVariable: string = "None";
    SelectedPolygonLabelShowVariable: string = "Hide";
    SelectedPolygonColorShowVariable: string = "Hide";
    SelectedPolygonColorTableShowVariable: string = "Hide";


    // Node Tab    
    SelectedNodeLabelVariable: string = "None";
    SelectedNodeLabelOrientationVariable: string = "Right";
    SelectedNodeTooltipVariable: string = "None";
    SelectedNodeSymbolVariable: string = "None";
    SelectedNodeShapeVariable: string = "symbolCircle";
    SelectedNodeRadiusVariable: string = "None";
    SelectedNodeRadiusSizeVariable: string = "None";
    SelectedNodeRadiusSizeMaxVariable: string = "None";
    SelectedNodeRadiusSizeMinVariable: string = "None";
    TableTypes: any = [
        { label: 'Show', value: 'Show' },
        { label: 'Hide', value: 'Hide' }
    ];
    SelectedNetworkTableTypeVariable: string = "Hide";

    private isExportClosed: boolean = false;
    public isExporting: boolean = false;

    // Link Tab
    SelectedLinkTooltipVariable: string = "None";
    SelectedLinkLabelVariable: string = "None";
    SelectedLinkTransparencyVariable: any = 0;
    SelectedLinkWidthByVariable: string = "None";

    ReciprocalTypes: any = [
        { label: 'Reciprocal', value: 'Reciprocal' },
        { label: 'Non-Reciprocal', value: 'Non-Reciprocal' }
    ];
    SelectedLinkReciprocalTypeVariable: string = "Reciprocal";

    SelectedLinkWidthVariable: any = 0;
    SelectedLinkLengthVariable: any = 0;
    ArrowTypes: any = [
        { label: 'Hide', value: 'Hide' },
        { label: 'Show', value: 'Show' }
    ];

    hideShowOptions: any = [
        { label: 'Hide', value: 'Hide' },
        { label: 'Show', value: 'Show' }
    ];
    SelectedLinkArrowTypeVariable: string = "Hide";

    // Network 
    NeighborTypes: any = [
        { label: 'Normal', value: 'Normal' },
        { label: 'Highlighted', value: 'Highlighted' }
    ];
    SelectedNetworkNeighborTypeVariable: string = "Normal";

    GridLineTypes: any = [
        { label: 'Hide', value: 'Hide' },
        { label: 'Show', value: 'Show' }
    ];
    SelectedNetworkGridLineTypeVariable: string = "Hide";

    SelectedNetworkChargeVariable: any = 200;
    SelectedNetworkGravityVariable: any = .05;
    SelectedNetworkFrictionVariable: any = .4;
    SelecetedNetworkLinkStrengthVariable: any = 0.123;
    SelectedNetworkExportFilenameVariable: string = "";

    NetworkExportFileTypeList: any = [
        { label: 'png', value: 'png' },
        { label: 'jpeg', value: 'jpeg' },
        { label: 'webp', value: 'webp' },
        { label: 'svg', value: 'svg' }
    ];

    SelectedNetworkExportFileTypeListVariable: string = "png";
    SelectedNetworkExportScaleVariable: any = 1;
    SelectedNetworkExportQualityVariable: any = 0.92;
    CalculatedResolutionWidth: any = 1918;
    CalculatedResolutionHeight: any = 909;
    CalculatedResolution: any = ((this.CalculatedResolutionWidth * this.SelectedNetworkExportScaleVariable) + " x " + (this.CalculatedResolutionHeight * this.SelectedNetworkExportScaleVariable) + "px");

    SelectedNodeLabelSizeVariable: any = 16;

    public nodeBorderWidth = 2.0;

    ShowNodeSymbolWrapper: boolean = false;
    ShowNodeSymbolTable: boolean = false;
    ShowPolygonColorTable: boolean = false;
    ShowAdvancedExport: boolean = true;

    NodeSymbolTableWrapperDialogSettings: DialogSettings = new DialogSettings('#node-symbol-table-wrapper', false);
    PolygonColorTableWrapperDialogSettings: DialogSettings = new DialogSettings('#polygon-color-table-wrapper', false);

    Node2DNetworkExportDialogSettings: DialogSettings = new DialogSettings('#network-settings-pane', false);

    ContextSelectedNodeAttributes: {attribute: string, value: string}[] = [];

    private visuals: MicrobeTraceNextVisuals;

    constructor(injector: Injector,
        private eventManager: EventManager,
        public commonService: CommonService,
        private cdref: ChangeDetectorRef) {

        super(injector);

        this.visuals = commonService.visuals;
        this.commonService.visuals.twoD = this;
    }

    ngOnInit() {
        this.visuals.twoD.commonService.updateNetwork();
        this.InitView();
    }

    InitView() {

        this.visuals.twoD.IsDataAvailable = (this.visuals.twoD.commonService.session.data.nodes.length === 0 ? false : true);
        if (!this.visuals.twoD.commonService.session.style.widgets['default-distance-metric']) {
          this.visuals.twoD.commonService.session.style.widgets['default-distance-metric'] = 
            this.visuals.twoD.commonService.GlobalSettingsModel.SelectedDistanceMetricVariable;
          this.visuals.twoD.commonService.session.style.widgets['link-threshold'] = 
            this.visuals.twoD.commonService.GlobalSettingsModel.SelectedLinkThresholdVariable;
        }

        if (this.visuals.twoD.IsDataAvailable === true && this.visuals.twoD.zoom === null) {

            d3.select('svg#network').exit().remove();
            this.visuals.twoD.svg = d3.select('svg#network').append('g');

            this.visuals.twoD.FieldList = [];

            this.visuals.twoD.FieldList.push({ label: "None", value: "None" });
            this.visuals.twoD.commonService.session.data['nodeFields'].map((d, i) => {

                this.visuals.twoD.FieldList.push(
                    {
                        label: this.visuals.twoD.commonService.capitalize(d.replace("_", "")),
                        value: d
                    });

            });


            this.visuals.twoD.ToolTipFieldList = [];

            this.visuals.twoD.ToolTipFieldList.push({ label: "None", value: "None" });
            this.visuals.twoD.commonService.session.data['linkFields'].map((d, i) => {

                this.visuals.twoD.ToolTipFieldList.push(
                    {
                        label: this.visuals.twoD.commonService.capitalize(d.replace("_", "")),
                        value: d
                    });

            });


            this.visuals.twoD.svgStyle = {
                'height': '88vh',
                'min-width.%': 100,
                "margin-top" : '-39px'

            };

            this.visuals.twoD.zoom = d3.zoom().on('zoom', () => this.visuals.twoD.svg.attr('transform', this.visuals.twoD.transform = d3.event.transform));
            this.visuals.twoD.brush = d3.brush();
            this.visuals.twoD.halfWidth = $('#network').parent().width() / 2;
            this.visuals.twoD.halfHeight = $('#network').parent().parent().parent().height() / 2;
            this.visuals.twoD.transform = d3.zoomTransform(d3.select('svg#network').node());
            this.visuals.twoD.commonService.session.style.widgets = this.visuals.twoD.commonService.session.style.widgets;

            let zoom = d3.zoom().on('zoom', () => this.visuals.twoD.svg.attr('transform', this.visuals.twoD.transform = d3.event.transform));

            let brush = d3.brush()
                .on('start', () => {
                    this.visuals.twoD.commonService.session.network.nodes.forEach(d => {
                        if (d.visible) d._previouslySelected = d.selected;
                    });
                })
                .on('brush', () => {

                    let e = d3.event;
                    if (e.sourceEvent.type == 'end') return;
                    let selection0: any = this.visuals.twoD.transform.invert(e.selection[0]),
                        selection1: any = this.visuals.twoD.transform.invert(e.selection[1]);


                    //if (this.visuals.twoD.commonService.includes($(this).selection, null)) return;

                    this.visuals.twoD.commonService.session.network.nodes.forEach(d => {

                        let exp: any = ((selection0[0] <= d.x && d.x <= selection1[0] && selection0[1] <= d.y && d.y <= selection1[1]));

                        d.selected = (d._previouslySelected ^ (exp)) == 1;
                    });
                })
                .on('end', () => {
                    if (d3.event.selection == null) return;
                    this.visuals.twoD.commonService.session.network.nodes.forEach(d => delete d._previouslySelected);
                    this.visuals.twoD.commonService.session.data.nodes.forEach(d => {
                        let match = this.visuals.twoD.commonService.session.network.nodes.find(node => node._id == d._id);
                        if (match) d.selected = match.selected;
                    });


                    this.visuals.twoD.render(true);
                    $(document).trigger('node-selected');
                });

            d3.select('svg#network')
                .html(null) //Let's make sure the canvas is blank.
                .on('click', ()=>this.visuals.twoD.hideContextMenu())
                .call(zoom);

            d3.select('svg#network')
                .append('g')
                .attr('class', 'brush')
                .call(brush)
                .attr('pointer-events', 'none')
                .select('rect.overlay')
                .attr('pointer-events', 'none');

            d3.select('svg#network')
                .append('g')
                .attr('class', 'horizontal-gridlines');

            d3.select('svg#network')
                .append('g')
                .attr('class', 'vertical-gridlines');


            this.visuals.twoD.svg = d3.select('svg#network').append('g');

            this.visuals.twoD.svg.append('g').attr('class', 'clusters');
            this.visuals.twoD.svg.append('g').attr('class', 'links');
            this.visuals.twoD.svg.append('g').attr('class', 'nodes');
            this.visuals.twoD.svg.append('g').attr('class', 'clustersLabels');

            this.visuals.twoD.svg.append('svg:defs').append('marker')
                .attr('id', 'end-arrow')
                .attr('viewBox', '0 0 10 10')
                .attr('refX', 20)
                .attr('refY', 5)
                .attr('markerWidth', 4)
                .attr('markerHeight', 4)
                .attr('orient', 'auto')
                .append('svg:path')
                .attr('d', 'M0,0 L0,10 L10,5 z');

            this.visuals.twoD.force = d3.forceSimulation()
                .force('link', d3.forceLink()
                    .id(d => d._id)
                    .distance(l => l.origin.length * this.visuals.twoD.commonService.session.style.widgets['link-length'])
                    .strength(this.visuals.twoD.commonService.session.style.widgets['network-link-strength'])
                )
                .force('charge', d3.forceManyBody()
                    .strength(-this.visuals.twoD.commonService.session.style.widgets['node-charge'])
                )
                .force('gravity', forceAttract()
                    .target([this.visuals.twoD.halfWidth, this.visuals.twoD.halfHeight])
                    .strength(this.visuals.twoD.commonService.session.style.widgets['network-gravity'])
                )
                .force('center', d3.forceCenter(this.visuals.twoD.halfWidth, this.visuals.twoD.halfHeight));

            if (this.visuals.twoD.commonService.session.style.widgets['network-friction']) this.visuals.twoD.force.velocityDecay(this.visuals.twoD.commonService.session.style.widgets['network-friction']);

            // this.visuals.twoD.clipboard.on('success', ()=>this.hideContextMenu());

            d3.select(window).on('keydown keyup', () => {
                d3.select('g.brush')
                    .attr('pointer-events', d3.event.ctrlKey ? 'all' : 'none')
                    .select('rect.overlay')
                    .attr('pointer-events', d3.event.ctrlKey ? 'all' : 'none');
            });

            let that = this;

            // this.visuals.twoD.eventManager.addGlobalEventListener('window', 'node-color-change', () => {

            //     this.visuals.twoD.updateNodeColors;
            // });

            // $( document ).on( "node-color-change", function( ) {
            //     that.visuals.twoD.updateNodeColors;
            // });

            // // this.visuals.twoD.eventManager.addGlobalEventListener('window', 'link-color-change', () => {

            // //     this.visuals.twoD.updateLinkColor;
            // // });

            // $( document ).on( "link-color-change", function( ) {
            //     that.visuals.twoD.updateLinkColor;
            // });

            // // this.visuals.twoD.eventManager.addGlobalEventListener('window', 'background-color-change', () => {

            // //     $('#network').css('background-color', this.visuals.twoD.commonService.session.style.widgets['background-color']);
            // // });

            // $( document ).on( "background-color-change", function( ) {
            //     $('#network').css('background-color', that.visuals.twoD.commonService.session.style.widgets['background-color']);
            // });

            // // this.visuals.twoD.eventManager.addGlobalEventListener('document', 'node-visibility link-visibility cluster-visibility node-selected', () => {

            // //     this.visuals.twoD.render(false);
            // // });


            // $( document ).on( "node-selected", function( ) {
            //         that.visuals.twoD.render(false);
            // });

            $( document ).on( "node-visibility", function( ) {
                that.visuals.twoD.render(false);
            });

            $( document ).on( "link-visibility", function( ) {
            that.visuals.twoD.render(false);
            });

            $( document ).on( "cluster-visibility", function( ) {
            that.visuals.twoD.render(false);
            });

            $( document ).on( "node-selected", function( ) {
                that.visuals.twoD.render(false);
            });

            this.visuals.twoD.eventManager.addGlobalEventListener('window', "node-selected", () => {
                this.visuals.twoD.render(false);
            });

            if (this.visuals.twoD.commonService.session.files.length > 1) $('#link-color-variable').val('origin').change();
            if (this.visuals.twoD.commonService.session.style.widgets['background-color']) $('#network').css('background-color', this.visuals.twoD.commonService.session.style.widgets['background-color']);
            this.visuals.microbeTrace.SelectedStatisticsTypesVariable = 'Show';
            this.visuals.microbeTrace.onShowStatisticsChanged();
            this.visuals.twoD.render();

            //For some mysterious reason, this really needed a delay...
            setTimeout(() => {

                if (this.visuals.twoD.commonService.session.style.widgets['node-symbol-variable'] !== 'None') {
                    $('#node-symbol-variable').change(); //.trigger('change');
                }
            }, 1);

            setTimeout(() =>{
                this.visuals.twoD.fit(undefined, undefined);
                this.loadSettings();
                // Add a little force for effect in landing
                this.visuals.twoD.force.alpha(1).alphaTarget(0).restart();
            }
                , 3000);


        }


    }

    onDataChange(event) {

    }

    // loadDefaultVisualization(e: String) {

    //     setTimeout(() => {

    //         this.commonService.session.messages = [];
    //         // this.messages = [];
    //         $('#loading-information').html('');
    //         $('#launch').prop('disabled', false).focus();

    //         // this.displayloadingInformationModal = false;

    //     }, 1000);

    //     this.LoadDefaultVisualizationEvent.emit(e);
    // }


    updateCalculatedResolution(event) {

        this.CalculatedResolution = (Math.round(this.CalculatedResolutionWidth * this.SelectedNetworkExportScaleVariable) + " x " + Math.round(this.CalculatedResolutionHeight * this.SelectedNetworkExportScaleVariable) + "px");
        this.cdref.detectChanges();
    }


    showGlobalSettings() {
        console.log("threshold: ",  this.commonService.GlobalSettingsModel.SelectedLinkThresholdVariable);
        this.DisplayGlobalSettingsDialogEvent.emit("Styling");
    }

    exportVisualization(event) {

        this.visuals.twoD.Show2DExportPane = false;
        this.isExporting = true;

        if (this.commonService.session.style.widgets['node-symbol-variable'] != 'None') {
            this.generateNodeSymbolSelectionTable("#node-symbol-table-bottom", this.visuals.twoD.commonService.session.style.widgets['node-symbol-variable'], false);
        }

        if (this.commonService.session.style.widgets['node-color-variable'] != 'None') {
            this.visuals.microbeTrace.generateNodeColorTable("#node-color-table-bottom", false);
        }

        if (this.commonService.session.style.widgets['link-color-variable'] != 'None') {
            this.visuals.microbeTrace.generateNodeLinkTable("#link-color-table-bottom", false);
        }

        if (!this.isExportClosed) {
            setTimeout(() => this.exportVisualization(undefined), 300);
        }
        else {
            this.exportWork();
        }
    }

    onCloseExport() {
        this.isExportClosed = true;
    }

    // Remove pop windows that should dissapear when clicked on the network
    networkWhitespaceClicked() : void {

        // The color transparency slider should dissapear if clicked out
        $("#color-transparency-wrapper").css({
            display: "none"
        });
    }

    exportWork() {
        let network = document.getElementById('network');
        let $network = $(network);
        let watermark = d3.select(network).append('text')
            .text('MicrobeTrace')
            .attr('x', $network.width() - 170)
            .attr('y', $network.height() - 20)
            .attr('class', 'watermark');
        let filetype = this.SelectedNetworkExportFileTypeListVariable, 
            filename = this.SelectedNetworkExportFilenameVariable;
        if (filetype == 'svg') {
           
            network.style.height = '100%';
            network.style.width = '100%';
            let content = this.visuals.twoD.commonService.unparseSVG(network);
            let blob = new Blob([content], { type: 'image/svg+xml;charset=utf-8' });
            saveAs(blob, filename + '.' + filetype);
            watermark.remove();
            const style: any = this.svgStyle;
            network.style.height = style.height;
            network.style.width = style.width;
            
        } else {
            setTimeout(() => {
                const scale: number = this.visuals.twoD.SelectedNetworkExportScaleVariable;
                const element = document.querySelector('TwoDComponent').parentElement;
                domToImage.toBlob(element, {
                    width: element.clientWidth * scale,
                    height: element.clientHeight * scale,
                    style: {
                        transform: 'scale(' + scale + ')',
                        transformOrigin: 'top left'
                    },
                    quality: this.visuals.twoD.SelectedNetworkExportQualityVariable
                })
                    .then((blob) => {
                        saveAs(blob, filename + '.' + filetype);

                        watermark.remove();
                        this.visuals.twoD.isExporting = false;
                        this.visuals.microbeTrace.clearTable("#node-symbol-table-bottom");
                        this.visuals.microbeTrace.clearTable("#node-color-table-bottom");
                        this.visuals.microbeTrace.clearTable("#link-color-table-bottom");

                        this.visuals.microbeTrace.GlobalSettingsDialogSettings.restoreStateAfterExport();
                        this.visuals.microbeTrace.GlobalSettingsLinkColorDialogSettings.restoreStateAfterExport();
                        this.visuals.microbeTrace.GlobalSettingsNodeColorDialogSettings.restoreStateAfterExport();
                        this.visuals.twoD.NodeSymbolTableWrapperDialogSettings.restoreStateAfterExport();
                        this.visuals.twoD.PolygonColorTableWrapperDialogSettings.restoreStateAfterExport();
                        this.visuals.twoD.Node2DNetworkExportDialogSettings.restoreStateAfterExport();
                    });
            }, 1000);
           
        }
    }


    render(showStatistics: boolean = true) {

        if (!$('#network').length) return;

        $("#numberOfSelectedNodes").text(this.visuals.twoD.commonService.session.data.nodes.filter(d => d.selected).length.toLocaleString());

        const start = Date.now();
        let newNodes = this.visuals.twoD.commonService.getVisibleNodes(true);
        let oldNodes;

        if(this.visuals.twoD.commonService.session.style.widgets["timeline-date-field"] != 'None')
            oldNodes = this.visuals.twoD.commonService.session.network.timelineNodes;
        else
            oldNodes = this.visuals.twoD.commonService.session.network.nodes;
        
        if (newNodes.length === 0 && this.visuals.twoD.commonService.session.style.widgets["timeline-date-field"] == 'None') return;

        newNodes.forEach((d, i) => {
            let match = oldNodes.find(d2 =>  {
                if(!d2.id) {
                    d2.id = d2._id;
                }
                if(!d.id){
                    d.id = d._id;
                }
                return d2.id == d.id
            });            
            if (match) {
                ['x', 'y', 'fx', 'fy', 'vx', 'vy', 'fixed'].forEach(v => {
                    
                    if (typeof match[v] != "undefined") {
                        d[v] = match[v];
                    } 

                });
            }
        });

        this.visuals.twoD.commonService.session.network.nodes = newNodes;

        let nodes = this.visuals.twoD.svg.select('g.nodes').selectAll('g').data(newNodes, d => d._id)
            .join(
                enter => {
                    let g = enter.append('g')
                        .attr('tabindex', '0')
                        .call(d3.drag() //A bunch of mouse handlers.
                            .on('start', (x) => this.visuals.twoD.dragstarted(x))
                            .on('drag', (x) => this.visuals.twoD.dragged(x))
                            .on('end', (x) => this.visuals.twoD.dragended(x)))
                        .on('mouseenter focusin', (x) => this.visuals.twoD.showNodeTooltip(x))
                        .on('mouseout focusout', (x) => this.visuals.twoD.hideTooltip())
                        .on('contextmenu', (x) => this.visuals.twoD.showContextMenu(x))
                        .on('click', (x) => this.visuals.twoD.clickHandler(x))
                        .on('keydown', n => {
                            if (d3.event.code == 'Space') this.visuals.twoD.clickHandler(n);
                            if (d3.event.shiftKey && d3.event.key == 'F10') this.visuals.twoD.showContextMenu(n);
                        });
                       g.append('path')
                        .style('stroke', 'black')
                        .style('stroke-width', '2px');
                    g.append('text')
                        .attr('dy', 5)
                        .attr('dx', 8);
                    return g;
                }
            );


        this.visuals.twoD.redrawNodes();
        this.visuals.twoD.updateNodeColors();
        this.visuals.twoD.redrawLabels();
        this.visuals.twoD.redrawNodeBorder();


        let vlinks = this.visuals.twoD.getVLinks();
        let links = this.visuals.twoD.svg.select('g.links').selectAll('line').data(vlinks)
            .join('line')
            .attr('stroke-width', this.visuals.twoD.commonService.session.style.widgets['link-width'])
            .attr('opacity', 1 - this.visuals.twoD.commonService.session.style.widgets['link-opacity'])
            .on('mouseenter', (x) => this.visuals.twoD.showLinkTooltip(x))
            .on('mouseout', (x) => this.visuals.twoD.hideTooltip());

        this.visuals.twoD.updateLinkColor();
        this.visuals.twoD.scaleLinkWidth();

        let linklabels = this.visuals.twoD.svg.select('g.links').selectAll('text').data(this.visuals.twoD.getLLinks())
            .join('text')
            .attr('text-anchor', 'middle')
            .attr('dy', this.visuals.twoD.commonService.session.style.widgets['link-width'] + 2)
            .text(l => l[this.visuals.twoD.commonService.session.style.widgets['link-label-variable']]);

        let layoutTick = () => {
             nodes
                .attr('transform', d => {
                    var ew =
                        d.fixed ?
                            `translate(${d.fx}, ${d.fy})` :
                            `translate(${d.x}, ${d.y})`;

                    return ew;
                }
                );
            links
                .attr('x1', l => l.source.x)
                .attr('y1', l => l.source.y)
                .attr('x2', l => l.target.x)
                .attr('y2', l => l.target.y);


            if (this.visuals.twoD.commonService.session.style.widgets['link-label-variable'] !== 'None') {
                linklabels
                    .attr('x', l => (l.source.x + l.target.x) / 2)
                    .attr('y', l => (l.source.y + l.target.y) / 2)
                    .attr('transform', l => 'rotate(' +
                        this.visuals.twoD.calcAngle(l.source, l.target) + ' ' +
                        (l.source.x + l.target.x) / 2 + ' ' +
                        (l.source.y + l.target.y) / 2 + ')'
                    );
            }
        };

        let foci = this.visuals.twoD.commonService.session.style.widgets['polygons-foci'];
        let gather = this.visuals.twoD.commonService.session.style.widgets['polygons-gather-force'];
        let fill = this.visuals.twoD.commonService.session.style.widgets['polygon-color'] as any;
        var opacity;
        
        if (this.visuals.twoD.commonService.session.style.widgets['polygons-color-show']) {
            fill = d => this.visuals.twoD.commonService.temp.style.polygonColorMap(d.key);
            opacity = (d) => this.visuals.twoD.commonService.temp.style.polygonAlphaMap(d.key);
            console.log('fill: ', fill);
        } else {
            opacity = 0.4;
        }

        d3.select('#network g.clusters').html(null);
        d3.select('#network g.clustersLabels').html(null);
        let groups = d3.nest().key(function(d) { return d[foci]; }).entries(newNodes).map(function(d) {
                var key = d.key
                var values = d.values.map(function(dd){
                dd.foci = key;
                return dd;
                })
                return {'key':key, 'values':values}
            });
        groups = groups.filter(group => group.values.length > 2 && group.key != 'null');  // remove group by empty
        let groupPath = function(d) {
            return "M" + 
            d3.polygonHull(d.values.map(function(i) { return [i.x, i.y]; }))
                .join("L")
            + "Z";
        }; 
        let polygonTextCord = function(d) {
            return d3.polygonHull(d.values.map(function(i) { return [i.x, i.y]; }));
        };
        let clusters = new Array(groups.length);  // The largest node for each cluster.
        newNodes.forEach(d => {
            let r =  d[foci];
            let i = d.foci;
            if (!clusters[i] || (r > clusters[i].radius)) 
            clusters[i] = d;
        })
        let polygonsTick = () => {
            newNodes.forEach(function(o, i) {
            o.y += (clusters[o.foci].y - o.y) * gather;
            o.x += (clusters[o.foci].x - o.x) * gather;
            });
            nodes.attr('transform', d => `translate(${d.x}, ${d.y})`);
            links
            .attr('x1', l => l.source.x)
            .attr('y1', l => l.source.y)
            .attr('x2', l => l.target.x)
            .attr('y2', l => l.target.y);
            if (this.visuals.twoD.commonService.session.style.widgets['link-label-variable'] !== 'None') {
            linklabels
                .attr('x', l => (l.source.x + l.target.x) / 2)
                .attr('y', l => (l.source.y + l.target.y) / 2)
                .attr('transform', l => 'rotate(' +
                this.calcAngle(l.source, l.target) + ' ' +
                (l.source.x + l.target.x) / 2 + ' ' +
                (l.source.y + l.target.y) / 2 + ')'
                );
            }
            d3.select('#network g.clusters').selectAll('path')
            .data(groups)
            .attr("d", groupPath) 
            .enter()
            .insert("path", "circle")
            .style("fill", fill)
            .style("stroke", fill)
            .style("stroke-width", 40)
            .style("stroke-linejoin", "round")
            .style("opacity", opacity)
            .attr("d", groupPath);
            d3.select('#network g.clusters').selectAll('path')
            .call(d3.drag() //A bunch of mouse handlers.
                    .on('start', (x) => this.visuals.twoD.polygonDragStarted(x))
                    .on('drag', (x) => this.visuals.twoD.polygonDragged(x))
                    .on('end', (x) =>  this.visuals.twoD.polygonDragEnded(x)))

                    // (x) => this.visuals.twoD.dragstarted(x)

            if (this.visuals.twoD.commonService.session.style.widgets['polygons-label-show']) {

            let g= d3.select('#network g.clustersLabels').text("").selectAll('text')
                .data(groups)
                .enter()
                .append("text")
                .attr('transform', function (d) { return "translate("+d3.polygonCentroid(polygonTextCord(d))+")"; })
                .text(d => this.visuals.twoD.commonService.titleize("" + d.key));
                
                d3.select('#network g.clustersLabels').selectAll('text').attr("class","WashingT")
                .call(d3.drag()
                .on("start", this.visuals.twoD.polygonLabelDragStarted)
                .on("drag", this.visuals.twoD.polygonLabelDragged)
                .on("end", this.visuals.twoD.polygonLabelDragEnded));

            this.redrawPolygonLabels();
            }
        }      
        
        if(this.visuals.twoD.commonService.session.style.widgets['polygons-show']) this.visuals.twoD.commonService.temp.polygonGroups = groups;
        else delete this.visuals.twoD.commonService.temp.polygonGroups;

        let handleTick = d => {
            if(d) {
                return polygonsTick;
            }
            else return layoutTick;		
        }

        this.visuals.twoD.force.nodes(this.visuals.twoD.commonService.session.network.nodes).on('tick', handleTick(this.visuals.twoD.commonService.session.style.widgets['polygons-show']));
        this.visuals.twoD.force.force('link').links(vlinks);
        this.visuals.twoD.force.alpha(0.3).alphaTarget(0).restart();
        $('#node-symbol-variable').trigger('change');

        this.visuals.twoD.ShowStatistics = showStatistics;
        this.visuals.twoD.cdref.detectChanges();

    };

    polygonLabelDragStarted(d) {
        d3.select(this).raise().attr("class", "polygonText");
    }
    
    polygonLabelDragged(d) {

        d3.select(this).attr("transform", "translate(" + d3.event.x + "," + d3.event.y + ")");

    }

    updatePolygonColors() {
        let polygonSort = $("<a style='cursor: pointer;'>&#8645;</a>").on("click", e => {
            this.visuals.twoD.commonService.session.style.widgets["polygon-color-table-counts-sort"] = "";
          if (this.visuals.twoD.commonService.session.style.widgets["polygon-color-table-name-sort"] === "ASC")
          this.visuals.twoD.commonService.session.style.widgets["polygon-color-table-name-sort"] = "DESC"
          else
          this.visuals.twoD.commonService.session.style.widgets["polygon-color-table-name-sort"] = "ASC"
            this.visuals.twoD.updatePolygonColors();
        });
        let polygonColorHeaderTitle =  (this.visuals.twoD.commonService.session.style['overwrite'] && this.visuals.twoD.commonService.session.style['overwrite']['polygonColorHeaderVariable'] && this.visuals.twoD.commonService.session.style['overwrite']['polygonColorHeaderVariable'] == this.visuals.twoD.commonService.session.style.widgets['polygons-foci'] ? this.visuals.twoD.commonService.session.style['overwrite']['polygonColorHeaderTitle'] : "Polygon " + this.visuals.twoD.commonService.titleize(this.visuals.twoD.commonService.session.style.widgets['polygons-foci']));
        let polygonHeader = $("<th class='p-1' contenteditable>" + polygonColorHeaderTitle + "</th>").append(polygonSort);
        let countSort = $("<a style='cursor: pointer;'>&#8645;</a>").on("click", e => {
  
            this.visuals.twoD.commonService.session.style.widgets["polygon-color-table-name-sort"] = "";
          if (this.visuals.twoD.commonService.session.style.widgets["polygon-color-table-counts-sort"] === "ASC")
          this.visuals.twoD.commonService.session.style.widgets["polygon-color-table-counts-sort"] = "DESC"
          else
          this.visuals.twoD.commonService.session.style.widgets["polygon-color-table-counts-sort"] = "ASC"
            this.visuals.twoD.updatePolygonColors();
        });
        let countHeader = $((this.visuals.twoD.commonService.session.style.widgets["polygon-color-table-counts"] ? "<th>Count</th>" : "")).append(countSort);
        let polygonColorTable = $("#polygon-color-table")
          .empty()
          .append($("<tr></tr>"))
          .append(polygonHeader)
          .append(countHeader)
          .append((this.visuals.twoD.commonService.session.style.widgets["polygon-color-table-frequencies"] ? "<th>Frequency</th>" : ""))
          .append("<th>Color</th>" );
        if (!this.visuals.twoD.commonService.session.style['polygonValueNames']) this.visuals.twoD.commonService.session.style['polygonValueNames'] = {};
        let aggregates = this.visuals.twoD.commonService.createPolygonColorMap();
        let values = Object.keys(aggregates);
  
        if (this.visuals.twoD.commonService.session.style.widgets["polygon-color-table-counts-sort"] == "ASC")
          values.sort(function(a, b) { return aggregates[a] - aggregates[b] });
        else if (this.visuals.twoD.commonService.session.style.widgets["polygon-color-table-counts-sort"] == "DESC")
          values.sort(function(a, b) { return aggregates[b] - aggregates[a] });
        if (this.visuals.twoD.commonService.session.style.widgets["polygon-color-table-name-sort"] == "ASC")
          values.sort(function(a, b) { return a as any - (b as any) });
        else if (this.visuals.twoD.commonService.session.style.widgets["polygon-color-table-name-sort"] == "DESC")
          values.sort(function(a, b) { return b as any - (a as any) });
  
        let total = 0;
        values.forEach(d => total += aggregates[d] );
  
        let that = this;

        values.forEach((value, i) => {
            this.visuals.twoD.commonService.session.style['polygonColors'].splice(i, 1, this.visuals.twoD.commonService.temp.style.polygonColorMap(value));
            this.visuals.twoD.commonService.session.style['polygonAlphas'].splice(i, 1, this.visuals.twoD.commonService.temp.style.polygonAlphaMap(value));
          let colorinput = $('<input type="color" value="' + this.visuals.twoD.commonService.temp.style.polygonColorMap(value) + '">')
            .on("change", function(){
                that.visuals.twoD.commonService.session.style['polygonColors'].splice(i, 1, $(this).val() as string);
                that.visuals.twoD.commonService.temp.style.polygonColorMap = d3
                .scaleOrdinal(that.visuals.twoD.commonService.session.style['polygonColors'])
                .domain(values);
                that.render();
            });
          let alphainput = $("<a>⇳</a>").on("click", e => {
            $("#color-transparency-wrapper").css({
              top: e.clientY + 129,
              left: e.clientX,
              display: "block"
            });
            $("#color-transparency")
              .val(this.visuals.twoD.commonService.session.style['polygonAlphas'][i])
              .one("change", function() {
                that.visuals.twoD.commonService.session.style['polygonAlphas'].splice(i, 1, parseFloat($(this).val() as string));
                that.visuals.twoD.commonService.temp.style.polygonAlphaMap = d3
                  .scaleOrdinal(that.visuals.twoD.commonService.session.style['polygonAlphas'])
                  .domain(values);
                $("#color-transparency-wrapper").fadeOut();
                that.render();
              });
          });
          let cell = $("<td></td>")
            .append(colorinput)
            .append(alphainput);
  
          let row = $(
            "<tr>" +
              "<td data-value='" + value + "'>" +
                (that.visuals.twoD.commonService.session.style['polygonValueNames'][value] ? this.visuals.twoD.commonService.session.style['polygonValueNames'][value] : this.visuals.twoD.commonService.titleize("" + value)) +
              "</td>" +
              (that.visuals.twoD.commonService.session.style.widgets["polygon-color-table-counts"] ? "<td>" + aggregates[value] + "</td>" : "") +
              (that.visuals.twoD.commonService.session.style.widgets["polygon-color-table-frequencies"] ? "<td>" + (aggregates[value] / total).toLocaleString() + "</td>" : "") +
            "</tr>"
          ).append(cell);
          polygonColorTable.append(row);
        });
        
        this.visuals.twoD.commonService.temp.style.polygonColorMap = d3
          .scaleOrdinal(this.visuals.twoD.commonService.session.style['polygonColors'])
          .domain(values);
          this.visuals.twoD.commonService.temp.style.polygonAlphaMap = d3
          .scaleOrdinal(this.visuals.twoD.commonService.session.style['polygonAlphas'])
          .domain(values);
  
        polygonColorTable
          .find("td")
          .on("dblclick", function() {
            // $(this).attr("contenteditable", true).focus();
          })
          .on("focusout", function() {
            let $this = $(this);
            // $this.attr("contenteditable", false);
            that.visuals.twoD.commonService.session.style['polygonValueNames'][$this.data("value")] = $this.text();
          });
          
        polygonColorTable
          .find(".p-1")
          .on("focusout", function() {
            that.visuals.twoD.commonService.session.style['overwrite']['polygonColorHeaderVariable'] = that.visuals.twoD.commonService.session.style.widgets["polygons-foci"];
            that.visuals.twoD.commonService.session.style['overwrite']['polygonColorHeaderTitle'] = $($(this).contents()[0]).text();
          });
  
        // this.sortable("#polygon-color-table", { items: "tr" });
        this.visuals.twoD.render();
      }

    polygonsShow() {
        console.log("show");
        this.visuals.twoD.commonService.session.style.widgets['polygons-show'] = true;
      $(".polygons-settings-row").slideDown();
      if(this.visuals.twoD.commonService.session.style.widgets['polygons-color-show'] == true){
        $('#polygons-color-show').click();
      } else {
        $('#polygons-color-hide').click();
      }
      if(this.visuals.twoD.commonService.session.style.widgets['polygons-label-show'] == true){
        $('#polygons-label-show').click();
      } else {
        $('#polygons-label-hide').click();
      }

      this.render();
    }

    polygonsHide() {

        console.log('hide called');

        this.visuals.twoD.commonService.session.style.widgets['polygons-show'] = false;
        $(".polygons-settings-row").slideUp();
        $('.polygons-label-row').slideUp();
        $("#polygon-color-table-row").slideUp();
        $("#polygon-color-value-row").slideUp();
        $("#polygon-color-table").empty();

      this.render();
    }

    polygonColorsToggle(e) {
        if (e == "Show") {
            this.visuals.twoD.commonService.session.style.widgets['polygons-color-show'] = true;
            $("#polygon-color-value-row").slideUp();
            $("#polygon-color-table-row").slideDown();
            this.visuals.twoD.PolygonColorTableWrapperDialogSettings.setVisibility(true);
            this.visuals.twoD.updatePolygonColors();

            setTimeout(() => {
                this.visuals.twoD.updatePolygonColors();
            }, 200);

        }
        else {
            this.visuals.twoD.commonService.session.style.widgets['polygons-color-show'] = false;
            $("#polygon-color-value-row").slideDown();
            $("#polygon-color-table-row").slideUp();
            $("#polygon-color-table").empty();
            this.visuals.twoD.PolygonColorTableWrapperDialogSettings.setVisibility(false);

        }

        this.visuals.twoD.render();
    }

    onPolygonColorChanged(e) {
        this.visuals.twoD.commonService.session.style.widgets["polygon-color"] = e;
        this.visuals.twoD.render();
    }

    polygonColorsTableToggle(e) {

        if (e == "Show") {
            this.visuals.twoD.onPolygonColorTableChange('Show')
        }
        else {
            this.visuals.twoD.onPolygonColorTableChange('Hide')
        }

        this.visuals.twoD.render();
    }

    polygonLabelDragEnded(d) {
        d3.select(this).attr("class", "");
    }

    redrawPolygonLabels() {
        let nodes = d3.select('#network g.clustersLabels').selectAll('text');
        let size = this.visuals.twoD.commonService.session.style.widgets['polygons-label-size'],
          orientation = this.visuals.twoD.commonService.session.style.widgets['polygons-label-orientation'];

        nodes
          .style('font-size', size + 'px');
        switch (orientation) {
          case 'Left':
            nodes
              .attr('text-anchor', 'end')
              .attr('dx', -8)
              .attr('dy', (size - 4) / 2);
            break;
          case 'Top':
            nodes
              .attr('text-anchor', 'middle')
              .attr('dx', 0)
              .attr('dy', 4 - size);
            break;
          case 'Bottom':
            nodes
              .attr('text-anchor', 'middle')
              .attr('dx', 0)
              .attr('dy', size + 4);
            break;
          case 'Right':
            nodes
              .attr('text-anchor', 'start')
              .attr('dx', 8)
              .attr('dy', (size - 4) / 2);		  
            break;
          default: // 'Middle':
            nodes
              .attr('text-anchor', 'middle')
              .attr('dx', 0)
              .attr('dy', (size - 4) / 2);     
        }
      }

    private polygonNodeSelected = null;

    polygonDragStarted(n) {

        this.visuals.twoD.commonService.session.data.nodes.forEach(sessionNode => {

            let tempAry = n.values.filter(node => {
                return node._id == sessionNode._id;
            });

            if (tempAry.length > 0) {
                if(!this.polygonNodeSelected) {
                    this.polygonNodeSelected = sessionNode;
                }
                sessionNode.selected = true;
            } else {
                sessionNode.selected = false
            }

      });

      $(document).trigger('node-selected');

      
      if(this.polygonNodeSelected) {
        this.dragstarted(this.polygonNodeSelected);
      }

    }

    polygonDragged(n) {

      if(this.polygonNodeSelected) {
        this.dragged(this.polygonNodeSelected);
      }

    }


    polygonDragEnded(n) {

      if(this.polygonNodeSelected) {
        this.dragended(this.polygonNodeSelected);
      }

      this.polygonNodeSelected = null;

      this.visuals.twoD.commonService.session.data.nodes.forEach(sessionNode => {
        sessionNode.selected = false
      });

      $(document).trigger('node-selected');

    }


    getVLinks() {
        let vlinks = this.visuals.twoD.commonService.getVisibleLinks(true);
        let output = [];
        let n = vlinks.length;
        let nodes = this.visuals.twoD.commonService.session.network.nodes;
        for (let i = 0; i < n; i++) {
            if (vlinks[i].origin) {
                if (typeof vlinks[i].origin === 'object') {
                    if (vlinks[i].origin.length > 0) {
                      vlinks[i].origin.forEach((o, j, l) => {
                          const holder = Object.assign({}, vlinks[i], {
                              origin: o,
                              oNum: j,
                              origins: l.length,
                              source: nodes.find(d => d._id === vlinks[i].source || d.id === vlinks[i].source),
                              target: nodes.find(d => d._id === vlinks[i].target || d.id === vlinks[i].target)
                          });
                          output.push(holder);
                      });
                  } else {
                    const holder = Object.assign({}, vlinks[i], {
                        oNum: 0,
                        origins: 1,
                        source: nodes.find(d => d._id === vlinks[i].source || d.id === vlinks[i].source),
                        target: nodes.find(d => d._id === vlinks[i].target || d.id === vlinks[i].target)
                    });
                      output.push(holder);
                  }
                } else {
                    const holder = Object.assign({}, vlinks[i], {
                        oNum: 0,
                        origins: 1,
                        source: nodes.find(d => d._id === vlinks[i].source || d.id === vlinks[i].source),
                        target: nodes.find(d => d._id === vlinks[i].target || d.id === vlinks[i].target)
                    });
                      console.log(holder);
                      output.push(holder);
                }
            } else {
                const holder = Object.assign({}, vlinks[i], {
                    origin: 'Unknown',
                    oNum: 0,
                    origins: 1,
                    source: nodes.find(d => d._id === vlinks[i].source || d.id === vlinks[i].source),
                    target: nodes.find(d => d._id === vlinks[i].target || d.id === vlinks[i].target)
                });
                    output.push(holder);
            }
        }

        output =  output.filter(x=>x.source != undefined && x.target != undefined);
        return output;
    };

    getLLinks() {
        let vlinks = this.visuals.twoD.commonService.getVisibleLinks(true);
        let n = vlinks.length;
        for (let i = 0; i < n; i++) {
            vlinks[i].source = this.visuals.twoD.commonService.session.network.nodes.find(d => d._id == vlinks[i].source);
            vlinks[i].target = this.visuals.twoD.commonService.session.network.nodes.find(d => d._id == vlinks[i].target);
        }
        return vlinks;
    };

    calcAngle(source, target) {
        return Math.atan((source.y - target.y) / (source.x - target.x)) * this.visuals.twoD.radToDeg;
    };

    dragstarted(n) {
        if (!d3.event.active) this.visuals.twoD.force.alphaTarget(0.3).restart();
        function setNode(d) {
            d.fx = d.x;
            d.fy = d.y;
        }
        this.visuals.twoD.multidrag = n.selected;
        this.visuals.twoD.selected = this.visuals.twoD.svg.select('g.nodes')
            .selectAll('g')
            .data(this.visuals.twoD.commonService.session.network.nodes)
            .filter(d => d.selected);
        if (this.visuals.twoD.multidrag) {
            this.visuals.twoD.selected.each(setNode);
        } else {
            setNode(n);
        }
    };

    dragged(n) {
        function updateNode(d) {
            d.fx += d3.event.dx;
            d.fy += d3.event.dy;
        }
        if (this.visuals.twoD.multidrag) {
            this.visuals.twoD.selected.each(updateNode);
        } else {
            updateNode(n);
        }
    };

    dragended(n) {
        if (!d3.event.active) this.visuals.twoD.force.alphaTarget(0);
        let that = this;
        function unsetNode(d) {
            if (!d.fixed) {
                console.log('not fixed');
                d.fx = null;
                d.fy = null;
            } else {
                // save node location back to temp network for pinned network
                if(that.visuals.twoD.commonService.session.style.widgets["timeline-date-field"] != 'None') {
                  let node = that.visuals.twoD.commonService.session.network.timelineNodes.find(d2 => d2._id == d._id);
                  if(node) {
                    node.x = d.x;
                    node.y = d.y;
                    node.fx = d.fx;
                    node.fy = d.fy;
                  }
                }
              }
        }
        if (this.visuals.twoD.multidrag) {
            this.visuals.twoD.selected.each(unsetNode);
        } else {
            unsetNode(n);
        }
    };

    clickHandler(n) {
        if (d3.event.ctrlKey) {
            this.visuals.twoD.commonService.session.data.nodes.find(node => node._id == n._id).selected = !n.selected;
        } else {
            this.visuals.twoD.commonService.session.data.nodes.forEach(node => {
                if (node._id == n._id) {
                    node.selected = !n.selected;
                } else {
                    node.selected = false;
                }
            });
        }
 
        // this.visuals.twoD.render(false);

        $(document).trigger('node-selected');
    };

    showContextMenu(d) {
        d3.event.preventDefault();
        this.visuals.twoD.hideTooltip();
        $('#copyID').attr('data-clipboard-text', d._id);
        $('#copySeq').attr('data-clipboard-text', d.seq);
        d3.select('#viewAttributes').on('click', () => {

            this.visuals.twoD.ContextSelectedNodeAttributes = [];

            this.visuals.twoD.hideContextMenu();

            this.visuals.twoD.ShowNetworkAttributes = true;
            this.visuals.twoD.cdref.detectChanges();

            let target = $('#network-attribute-table').empty();
            let nd = this.visuals.twoD.commonService.session.data.nodes.find(nd => nd._id == d._id);
            for (let attribute in nd) {
                if (attribute[0] == '_') continue;
                this.visuals.twoD.ContextSelectedNodeAttributes.push({attribute: this.visuals.twoD.commonService.titleize(attribute), value: d[attribute]});
            }

            this.visuals.twoD.ContextSelectedNodeAttributes = 
            this.visuals.twoD.ContextSelectedNodeAttributes.filter(x=>x.attribute !== "Seq" && x.value !== undefined && x.value !== null && x.value !== "" )
            .concat(this.visuals.twoD.ContextSelectedNodeAttributes.filter(x=>x.attribute !== "Seq" && (x.value === undefined || x.value === null || x.value === "" )))
            .concat(this.visuals.twoD.ContextSelectedNodeAttributes.filter(x=>x.attribute === "Seq"));

        }).node().focus();
        if (d.fixed) {
            $('#pinNode').text('Unpin Node').on('click', () => {

                d.fx = null;
                d.fy = null;
                d.fixed = false;
                this.visuals.twoD.force.alpha(0.3).alphaTarget(0).restart();
                this.visuals.twoD.hideContextMenu();
            });

        } else {
            $('#pinNode').text('Pin Node').on('click', () => {

                d.fx = d.x;
                d.fy = d.y;
                d.fixed = true;
                this.visuals.twoD.hideContextMenu();
            });
        }
        $('#context-menu').css({
            'z-index': 1000,
            'display': 'block',
            'left': (d3.event.pageX - 300) + 'px',
            'top': (d3.event.pageY - 125) + 'px',
        }).animate({ 'opacity': 1 }, 80);
    };

    hideContextMenu() {

        $('#context-menu').animate({ 'opacity': 0 }, 80, () => {
            $(this).css('z-index', -1);
        });
    };

    showNodeTooltip(d) {
        if (this.visuals.twoD.commonService.session.style.widgets['node-highlight']) this.visuals.twoD.highlightNeighbors(d);
        //if ($('#node-tooltip-variable').val() == 'None') return;
        if (this.visuals.twoD.SelectedNodeTooltipVariable == 'None') return;

        //let htmlValue: any = $('#node-tooltip-variable').val();
        let htmlValue: any = this.visuals.twoD.SelectedNodeTooltipVariable;


        $('#tooltip').css({ top: d3.event.pageY - 28, left: d3.event.pageX + 8, position: 'absolute' });

        d3.select('#tooltip')
            .html(d[htmlValue])
            .style('left', (d3.event.pageX) + 8 + 'px')
            .style('top', (d3.event.pageY) - 28 + 'px')
            .style('z-index', 1000)
            .transition().duration(100)
            .style('opacity', 1)
            .style('color','#333333')
            .style('background','#f5f5f5')
            .style('border', '1px solid #cccccc')
            .style('border-radius','.25rem')
            .style('padding','.25rem')
            ;
    };

    highlightNeighbors(node) {
        let links = this.visuals.twoD.getVLinks();
        let lindices = [], neighbors = [node._id];

        let n = links.length;
        for (let i = 0; i < n; i++) {
            let l = links[i];
            if (l.source._id !== node._id && l.target._id !== node._id) {
                lindices.push(l.index);
            } else {
                if (l.source._id == node._id) {
                    neighbors.push(l.target._id);
                } else {
                    neighbors.push(l.source._id);
                }
            }
        }
        this.visuals.twoD.svg
            .select('g.nodes')
            .selectAll('g')
            .selectAll('path')
            .attr('opacity', d => this.visuals.twoD.commonService.includes(neighbors, d._id) ? 1 : .1);
        this.visuals.twoD.svg
            .select('g.links')
            .selectAll('line')
            .data(links)
            .attr('opacity', l => this.visuals.twoD.commonService.includes(lindices, l.index) ? .1 : 1);
    };

    showLinkTooltip(d) {
        let v: any = this.visuals.twoD.SelectedLinkTooltipVariable;
        if (v == 'None') return;

        $('#tooltip').css({ top: d3.event.pageY - 28, left: d3.event.pageX + 8, position: 'absolute' });


        d3.select('#tooltip')
            .html((v == 'source' || v == 'target') ? d[v]._id : d[v])
            .style('left', (d3.event.pageX + 8) + 'px')
            .style('top', (d3.event.pageY - 28) + 'px')
            .style('z-index', 1000)
            .transition().duration(100)
            .style('opacity', 1);
    };

    hideTooltip() {
        if (this.visuals.twoD.commonService.session.style.widgets['node-highlight']) {
            this.visuals.twoD.svg
                .select('g.nodes')
                .selectAll('g')
                .selectAll('path')
                .attr('opacity', 1);
            let linkOpacity = 1 - this.visuals.twoD.commonService.session.style.widgets['link-opacity'];
            this.visuals.twoD.svg
                .select('g.links')
                .selectAll('line')
                .attr('opacity', linkOpacity);
        }
        let tooltip = d3.select('#tooltip');
        tooltip
            .transition().duration(100)
            .style('opacity', 0)
            .on('end', () => tooltip.style('z-index', -1));
    };



    isNumber(a) {
        return typeof a == "number";
    };

    redrawNodes() {


        //Things to track in the function:
        //* Shapes:
        let type = d3[this.visuals.twoD.commonService.session.style.widgets['node-symbol']];
        let symbolVariable = this.visuals.twoD.commonService.session.style.widgets['node-symbol-variable'];
       
        // Custom Shape Selected
        if (type === undefined) {
            type = this.customShapes.shapes[this.visuals.twoD.commonService.session.style.widgets['node-symbol']];
        }

        //* Sizes:
        let defaultSize = this.visuals.twoD.commonService.session.style.widgets['node-radius'];
        let size = defaultSize, med = defaultSize, oldrng, min, max;
        let sizeVariable = this.visuals.twoD.commonService.session.style.widgets['node-radius-variable'];
        let scale;
        let nodes;
        if (sizeVariable !== 'None') {
            if (this.visuals.twoD.commonService.session.style.widgets["timeline-date-field"] == 'None') nodes = this.visuals.twoD.commonService.session.network.nodes;
            else nodes = this.visuals.twoD.commonService.session.network.timelineNodes;
            let n = this.visuals.twoD.commonService.session.network.nodes.length;
            min = Number.MAX_VALUE;
            max = Number.MIN_VALUE;
            for (let i = 0; i < n; i++) {
                let size = this.visuals.twoD.commonService.session.network.nodes[i][sizeVariable];
                if (typeof size == 'undefined') continue;
                if (size < min) min = size;
                if (size > max) max = size;
            }
            oldrng = max - min;
            med = oldrng / 2;

            let maxWidth = this.visuals.twoD.commonService.session.style.widgets['node-radius-max'];
            let minWidth = this.visuals.twoD.commonService.session.style.widgets['node-radius-min'];
            scale = d3.scaleLinear()
            .domain([min, max])
            .range([minWidth, maxWidth]);
            }
        
        nodes = this.visuals.twoD.svg.select('g.nodes').selectAll('g').data(this.visuals.twoD.commonService.session.network.nodes);

        // TODO: Hides table row by default if no symbol variable - clean up
        if(symbolVariable === 'None') {
            $('#node-symbol-table-row').slideUp();
        }

        // console.log('nodes: ', nodes);

        let that = this;

        nodes.selectAll('path').each(function (d) {

            if (symbolVariable !== 'None') {

                type = d3[that.visuals.twoD.commonService.temp.style.nodeSymbolMap(d[symbolVariable])];

                if (type === undefined) {
                    type = that.customShapes.shapes[that.visuals.twoD.commonService.temp.style.nodeSymbolMap(d[symbolVariable])];
                }
    
            } 
            if (sizeVariable !== 'None') {
              size = d[sizeVariable];
              if (!that.isNumber(size)) size = med;
              size = scale(size);
            }

            d3.select(this).attr('d', d3.symbol().size(size).type(type));    
            
          });

        // TODO: Remove when done
        // nodes.selectAll('path')._parents.forEach(x=>{
        //     const path = x.childNodes[0];
        //     const data = x.__data__;

            

        //     if (symbolVariable !== 'None') {
        //         type = d3[this.visuals.twoD.commonService.temp.style.nodeSymbolMap(data[symbolVariable])];

        //         // Custom Shape Selected
        //         if (type === undefined) {

        //             type = this.customShapes.shapes[this.visuals.twoD.commonService.temp.style.nodeSymbolMap(data[symbolVariable])];

        //         }

        //     }
        //     if (sizeVariable !== 'None') {
        //         size = data[sizeVariable];
        //         if (!this.visuals.twoD.isNumber(size)) size = med;
        //         size = (size - min) / oldrng;
        //         size = size * size * defaultSize + 100;
        //     }

        //         d3.select(path).attr('d', d3.symbol().size(size).type(type));

        //     });
    };

    private redrawNodeBorder(){
        let nodes = this.visuals.twoD.svg.select('g.nodes').selectAll('g').data(this.visuals.twoD.commonService.session.network.nodes);
        nodes
          .selectAll('path')
          .style('stroke', 'black')
          .style('stroke-width', this.visuals.twoD.commonService.session.style.widgets['node-border-width']);
      }


    redrawLabels() {

        let nodes = this.visuals.twoD.svg.select('g.nodes').selectAll('g').data(this.visuals.twoD.commonService.session.network.nodes).select('text'),
            labelVar = this.visuals.twoD.commonService.session.style.widgets['node-label-variable'];
        if (labelVar == 'None') {
            nodes.text('');
        } else {
            let size = this.visuals.twoD.commonService.session.style.widgets['node-label-size'],
                orientation = this.visuals.twoD.commonService.session.style.widgets['node-label-orientation'];
            nodes
                .text(n => n[labelVar])
                .style('font-size', size + 'px');
            switch (orientation) {
                case 'Left':
                    nodes
                        .attr('text-anchor', 'end')
                        .attr('dx', -8)
                        .attr('dy', (size - 4) / 2);
                    break;
                case 'Top':
                    nodes
                        .attr('text-anchor', 'middle')
                        .attr('dx', 0)
                        .attr('dy', 4 - size);
                    break;
                case 'Bottom':
                    nodes
                        .attr('text-anchor', 'middle')
                        .attr('dx', 0)
                        .attr('dy', size + 4);
                    break;
                case 'Middle':
                    nodes
                        .attr('text-anchor', 'middle')
                        .attr('dx', 0)
                        .attr('dy', (size - 4) / 2);
                    break;
                default: //'right'
                    nodes
                        .attr('text-anchor', 'start')
                        .attr('dx', 8)
                        .attr('dy', (size - 4) / 2);
            }
        }
    };

    //Polygon Events

    onPolygonLabelVariableChange(e) {

        this.visuals.twoD.commonService.session.style.widgets['polygons-label-variable'] = e;
        if (e == 'None') {
            $('.polygon-label-row').slideUp();
        } else {
            $('.polygon-label-row').css('display', 'flex');
        }
        this.redrawPolygonLabels();
        
    }

    centerPolygons(e) {

        this.visuals.twoD.commonService.session.style.widgets['polygons-foci'] = e;
        this.visuals.twoD.render();
        if(this.visuals.twoD.commonService.session.style.widgets['polygons-color-show'] == true) {
          $("#polygon-color-table").empty();
          this.visuals.twoD.updatePolygonColors();
        }
        
        if (e == 'None') {
            $('#color-polygons').slideDown();
            $('#polygon-color-value-row').slideDown();
          } else {
            $('#color-polygons').css('display', 'flex');
            $('#polygon-color-value-row').slideUp();
          }

    }

    setPolygonLabelSize(size) {
        this.visuals.twoD.commonService.session.style.widgets['polygons-label-size'] = parseFloat(size);
        this.visuals.twoD.redrawPolygonLabels();
    }

    onPolygonLabelSizeChange(e) {
        this.setPolygonLabelSize(e);
    }

    onPolygonLabelOrientationChange(e) {
        this.visuals.twoD.commonService.session.style.widgets['polygons-label-orientation'] = e;
        this.visuals.twoD.redrawPolygonLabels();
    }

    onPolygonGatherChange(e) {
        let v = parseFloat(e);
        this.visuals.twoD.commonService.session.style.widgets['polygons-gather-force'] = v;
        this.visuals.twoD.render();
    }

    onPolygonLabelShowChange(e) {
        if (e == "Show") {
            this.visuals.twoD.commonService.session.style.widgets['polygons-label-show'] = true;
            $('.polygons-label-row').slideDown();
            this.visuals.twoD.render();
        }
        else {
            this.visuals.twoD.commonService.session.style.widgets['polygons-label-show'] = false;
            $('.polygons-label-row').slideUp();
            this.visuals.twoD.render();
        }
    }

    onPolygonShowChange(e) {
        if (e == "Show") {
            this.visuals.twoD.commonService.session.style.widgets['polygons-label-show'] = true;
            $('.polygons-label-row').slideDown();
            this.visuals.twoD.render();
             //If hidden by default, unhide to perform slide up and down
            //  if(!this.ShowGlobalSettingsNodeColorTable){
            //     this.ShowGlobalSettingsNodeColorTable = true;
            // } else {
            //     $('#node-color-table-row').slideDown();
            // }
        }
        else {
            this.visuals.twoD.commonService.session.style.widgets['polygons-label-show'] = false;
            $('#node-color-value-row').slideDown();
            $('#node-color-table-row').slideUp();
            this.visuals.twoD.render();
        }
    }

generatePolygonColorSelectionTable(tableId: string, variable: string, isEditable: boolean = true) {
    this.visuals.microbeTrace.clearTable(tableId);

    let symbolMapping: { key: string, value: string }[] = [
        { key: 'symbolCircle', value: '&#11044; (Circle)' },
        { key: "symbolTriangle", value: '&#9650; (Up Triangle)' },
        { key: "symbolTriangleDown", value: '&#9660; (Down Triangle)' },
        { key: "symbolTriangleLeft", value: '&#9664; (Left Triangle)' },
        { key: "symbolTriangleRight", value: '&#9654; (Right Triangle)' },
        { key: "symbolDiamond", value: '&#10731; (Vertical Diamond)' },
        { key: "symbolDiamondAlt", value: '&#10731; (Horizontal Diamond)' },
        { key: "symbolSquare", value: '&#9632; (Square)' },
        { key: "symbolDiamondSquare", value: '&#9670; (Tilted Square)' },
        { key: "symbolPentagon", value: '&#11039; (Pentagon)' },
        { key: "symbolHexagon", value: '&#11042; (Hexagon)' },
        { key: "symbolHexagonAlt", value: '&#11043; (Tilted Hexagon)' },
        { key: "symbolOctagon", value: '&#11042; (Octagon)' },
        { key: "symbolOctagonAlt", value: '&#11043; (Tilted Octagon)' },
        { key: "symbolCross", value: '&#10010; (Addition Sign)' },
        { key: "symbolX", value: '&#10006; (Multiplication Sign)' },
        { key: "symbolWye", value: '&#120300; (Wye)' },
        { key: "symbolStar", value: '&#9733; (Star)' },
    ];

    let table = $(tableId)
    const disabled: string = isEditable ? '' : 'disabled';

    this.visuals.twoD.commonService.session.style.widgets['node-symbol-variable'] = variable;

    if (variable === 'None' && !isEditable) return;


    let values = [];
    let aggregates = {};
    let nodes = this.visuals.twoD.commonService.session.data.nodes;
    let n = nodes.length;
    let vnodes = 0;
    for (let i = 0; i < n; i++) {
        let d = nodes[i];
        if (!d.visible) continue;
        vnodes++;
        let dv = d[variable];
        if (values.indexOf(dv) == -1) values.push(dv);
        if (dv in aggregates) {
            aggregates[dv]++;
        } else {
            aggregates[dv] = 1;
        }
    }
    if (values.length > this.visuals.twoD.commonService.session.style.nodeSymbols.length) {
        let symbols = [];
        let m = Math.ceil(values.length / this.visuals.twoD.commonService.session.style.nodeSymbols.length);
        while (m-- > 0) {
            symbols = symbols.concat(this.visuals.twoD.commonService.session.style.nodeSymbols);
        }
        this.visuals.twoD.commonService.session.style.nodeSymbols = symbols;
    }

    table.empty().append(
        '<tr>' +
        `<th ${isEditable ? 'contenteditable' : ''}>Node ${this.visuals.twoD.commonService.titleize(variable)}</th>` +
        (this.visuals.twoD.commonService.session.style.widgets['node-symbol-table-counts'] ? '<th>Count</th>' : '') +
        (this.visuals.twoD.commonService.session.style.widgets['node-symbol-table-frequencies'] ? '<th>Frequency</th>' : '') +
        '<th>Shape</th>' +
        '</tr>');
    let options = $('#node-symbol2').html();

    values.sort( (a, b)  => {
        return aggregates[b] - aggregates[a];
    });
    
    this.visuals.twoD.commonService.temp.style.nodeSymbolMap = d3.scaleOrdinal(this.visuals.twoD.commonService.session.style.nodeSymbols).domain(values);
    
    values.forEach((v, i) => {

        let selector = $(`<select ${disabled}></select>`).append(options).val(this.visuals.twoD.commonService.temp.style.nodeSymbolMap(v)).on('change',  (e) => {
            this.visuals.twoD.commonService.session.style.nodeSymbols.splice(i, 1, (e.target as any).value);
            this.visuals.twoD.commonService.temp.style.nodeSymbolMap = d3.scaleOrdinal(this.visuals.twoD.commonService.session.style.nodeSymbols).domain(values);
            this.visuals.twoD.redrawNodes();
        });        
        let symbolText = symbolMapping.find(x => x.key === this.visuals.twoD.commonService.temp.style.nodeSymbolMap(v));

        let cell = $('<td></td>').append(isEditable ? selector : symbolText ? symbolText.value : '');
        let row = $(
            '<tr>' +
            `<td ${isEditable ? 'contenteditable' : ''}> ${this.visuals.twoD.commonService.titleize('' + v)} </td> ` +
            (this.visuals.twoD.commonService.session.style.widgets['node-symbol-table-counts'] ? ('<td>' + aggregates[v] + '</td>') : '') +
            (this.visuals.twoD.commonService.session.style.widgets['node-symbol-table-frequencies'] ? ('<td>' + (aggregates[v] / vnodes).toLocaleString() + '</td>') : '') +
            '</tr>'
        ).append(cell);
        table.append(row);
    });
}

onPolygonColorTableChange(e) {
    this.SelectedNetworkTableTypeVariable = e;
    this.visuals.twoD.commonService.session.style.widgets["polygon-color-table-visible"] = this.SelectedNetworkTableTypeVariable;
    if (this.SelectedNetworkTableTypeVariable == "Show") {
        this.PolygonColorTableWrapperDialogSettings.setVisibility(true);
    }
    else {
        // this.PolygonColorTableWrapperDialogSettings.setVisibility(false);
    }
}


    /*/
        Node Events
    /*/
    onNodeLabelVaribleChange(e) {

        this.visuals.twoD.commonService.session.style.widgets['node-label-variable'] = e;
        if (e == 'None') {
            $('.node-label-row').slideUp();
        } else {
            $('.node-label-row').css('display', 'flex');
        }
        this.redrawLabels();
    }

    onNodeLabelSizeChange(e) {
        this.setNodeLabelSize(e.target.value);
    }

    setNodeLabelSize(size) {
        this.visuals.twoD.commonService.session.style.widgets['node-label-size'] = parseFloat(size);
        this.visuals.twoD.redrawLabels();
    }

    onNodeLabelOrientationChange(e) {
        this.visuals.twoD.commonService.session.style.widgets['node-label-orientation'] = e;
        this.visuals.twoD.redrawLabels();
    }

    onNodeTooltipVariableChange(e) {
        this.visuals.twoD.commonService.session.style.widgets['node-tooltip-variable'] = e;
        this.visuals.twoD.redrawLabels();
    }

    onNodeSymbolVariableChange(e, setVisibility = true) {

            this.visuals.twoD.commonService.session.style.widgets['node-symbol-variable'] = this.SelectedNodeSymbolVariable;


            if(setVisibility){
                this.visuals.twoD.NodeSymbolTableWrapperDialogSettings.setVisibility(true);
                this.visuals.twoD.SelectedNetworkTableTypeVariable = "Show";

                if (this.SelectedNodeSymbolVariable !== 'None') {

                    $('#node-symbol-row').slideUp();
                    
                    //If hidden by default, unhide to perform slide up and down
                    if(!this.ShowNodeSymbolTable){
                        this.ShowNodeSymbolTable = true;
                    } else {
                        $('#node-symbol-table-row').slideDown();
                    }

                // No shape by variable selected
                // show shape, hide table 
                } else {

                    $('#node-symbol-row').slideDown();
                    $('#node-symbol-table-row').slideUp();
                    this.onNodeSymbolTableChange('Hide');

                }
    
            }


            this.visuals.twoD.cdref.detectChanges();

            this.generateNodeSymbolSelectionTable("#node-symbol-table", e);
            
            this.visuals.twoD.redrawNodes();

    }

    generateNodeSymbolSelectionTable(tableId: string, variable: string, isEditable: boolean = true) {
        this.visuals.microbeTrace.clearTable(tableId);

        let symbolMapping: { key: string, value: string }[] = [
            { key: 'symbolCircle', value: '&#11044; (Circle)' },
            { key: "symbolTriangle", value: '&#9650; (Up Triangle)' },
            { key: "symbolTriangleDown", value: '&#9660; (Down Triangle)' },
            { key: "symbolTriangleLeft", value: '&#9664; (Left Triangle)' },
            { key: "symbolTriangleRight", value: '&#9654; (Right Triangle)' },
            { key: "symbolDiamond", value: '&#10731; (Vertical Diamond)' },
            { key: "symbolDiamondAlt", value: '&#10731; (Horizontal Diamond)' },
            { key: "symbolSquare", value: '&#9632; (Square)' },
            { key: "symbolDiamondSquare", value: '&#9670; (Tilted Square)' },
            { key: "symbolPentagon", value: '&#11039; (Pentagon)' },
            { key: "symbolHexagon", value: '&#11042; (Hexagon)' },
            { key: "symbolHexagonAlt", value: '&#11043; (Tilted Hexagon)' },
            { key: "symbolOctagon", value: '&#11042; (Octagon)' },
            { key: "symbolOctagonAlt", value: '&#11043; (Tilted Octagon)' },
            { key: "symbolCross", value: '&#10010; (Addition Sign)' },
            { key: "symbolX", value: '&#10006; (Multiplication Sign)' },
            { key: "symbolWye", value: '&#120300; (Wye)' },
            { key: "symbolStar", value: '&#9733; (Star)' },
        ];

        let table = $(tableId)
        const disabled: string = isEditable ? '' : 'disabled';

        this.visuals.twoD.commonService.session.style.widgets['node-symbol-variable'] = variable;

        if (variable === 'None' && !isEditable) return;


        let values = [];
        let aggregates = {};
        let nodes = this.visuals.twoD.commonService.session.data.nodes;
        let n = nodes.length;
        let vnodes = 0;
        for (let i = 0; i < n; i++) {
            let d = nodes[i];
            if (!d.visible) continue;
            vnodes++;
            let dv = d[variable];
            if (values.indexOf(dv) == -1) values.push(dv);
            if (dv in aggregates) {
                aggregates[dv]++;
            } else {
                aggregates[dv] = 1;
            }
        }
        if (values.length > this.visuals.twoD.commonService.session.style.nodeSymbols.length) {
            let symbols = [];
            let m = Math.ceil(values.length / this.visuals.twoD.commonService.session.style.nodeSymbols.length);
            while (m-- > 0) {
                symbols = symbols.concat(this.visuals.twoD.commonService.session.style.nodeSymbols);
            }
            this.visuals.twoD.commonService.session.style.nodeSymbols = symbols;
        }

        table.empty().append(
            '<tr>' +
            `<th ${isEditable ? 'contenteditable' : ''}>Node ${this.visuals.twoD.commonService.titleize(variable)}</th>` +
            (this.visuals.twoD.commonService.session.style.widgets['node-symbol-table-counts'] ? '<th>Count</th>' : '') +
            (this.visuals.twoD.commonService.session.style.widgets['node-symbol-table-frequencies'] ? '<th>Frequency</th>' : '') +
            '<th>Shape</th>' +
            '</tr>');
        let options = $('#node-symbol2').html();

        values.sort( (a, b)  => {
            return aggregates[b] - aggregates[a];
        });
        
        this.visuals.twoD.commonService.temp.style.nodeSymbolMap = d3.scaleOrdinal(this.visuals.twoD.commonService.session.style.nodeSymbols).domain(values);
        
        values.forEach((v, i) => {

            let selector = $(`<select ${disabled}></select>`).append(options).val(this.visuals.twoD.commonService.temp.style.nodeSymbolMap(v)).on('change',  (e) => {
                this.visuals.twoD.commonService.session.style.nodeSymbols.splice(i, 1, (e.target as any).value);
                this.visuals.twoD.commonService.temp.style.nodeSymbolMap = d3.scaleOrdinal(this.visuals.twoD.commonService.session.style.nodeSymbols).domain(values);
                this.visuals.twoD.redrawNodes();
            });        
            let symbolText = symbolMapping.find(x => x.key === this.visuals.twoD.commonService.temp.style.nodeSymbolMap(v));

            let cell = $('<td></td>').append(isEditable ? selector : symbolText ? symbolText.value : '');
            let row = $(
                '<tr>' +
                `<td ${isEditable ? 'contenteditable' : ''}> ${this.visuals.twoD.commonService.titleize('' + v)} </td> ` +
                (this.visuals.twoD.commonService.session.style.widgets['node-symbol-table-counts'] ? ('<td>' + aggregates[v] + '</td>') : '') +
                (this.visuals.twoD.commonService.session.style.widgets['node-symbol-table-frequencies'] ? ('<td>' + (aggregates[v] / vnodes).toLocaleString() + '</td>') : '') +
                '</tr>'
            ).append(cell);
            table.append(row);
        });
    }

    onNodeRadiusVariableChange(e) {

        if (e == 'None') {
            $('#node-max-radius-row').slideUp();
            $('#node-min-radius-row').slideUp();
            $('#node-radius-row').slideDown();
          } else {
            $('#node-max-radius-row').css('display', 'flex');
            $('#node-min-radius-row').css('display', 'flex');
            $('#node-radius-row').slideUp();
          }

        this.visuals.twoD.commonService.session.style.widgets['node-radius-variable'] = e;
        this.visuals.twoD.redrawNodes();

    }

   onNodeRadiusMaxChange(e) {
    this.visuals.twoD.commonService.session.style.widgets['node-radius-max'] = e;
    this.visuals.twoD.redrawNodes();
   }

   onNodeRadiusMinChange(e) {
    this.visuals.twoD.commonService.session.style.widgets['node-radius-min'] = e;
    this.visuals.twoD.redrawNodes();
   }

    onNodeBorderWidthChange(e) {
        this.visuals.twoD.commonService.session.style.widgets['node-border-width'] = e;
        this.visuals.twoD.redrawNodeBorder();
    }

    onNodeRadiusChange(e) {

        this.visuals.twoD.commonService.session.style.widgets['node-radius'] = e;
        this.visuals.twoD.redrawNodes();
    }

    onNodeSymbolChange(e) {

        this.visuals.twoD.commonService.session.style.widgets['node-symbol'] = e;
        this.visuals.twoD.redrawNodes();
    }

    onNodeSymbolTableChange(e) {
        this.SelectedNetworkTableTypeVariable = e;
        this.visuals.twoD.commonService.session.style.widgets["node-symbol-table-visible"] = this.SelectedNetworkTableTypeVariable;
        if (this.SelectedNetworkTableTypeVariable == "Show") {
            this.NodeSymbolTableWrapperDialogSettings.setVisibility(true);
        }
        else {
            this.NodeSymbolTableWrapperDialogSettings.setVisibility(false);
        }
    }


    onLinkTooltipVariableChange(e) {

        this.visuals.twoD.commonService.session.style.widgets['link-tooltip-variable'] = e;
//TODO: umm.... do something here?
    }

    onLinkLabelVariableChange(e) {


        let label: any = e;
        this.visuals.twoD.commonService.session.style.widgets['link-label-variable'] = label;
        if (label == 'None') {
            this.visuals.twoD.svg.select('g.links').selectAll('text').text('');
        } else {
            this.visuals.twoD.svg.select('g.links').selectAll('text').data(this.visuals.twoD.getLLinks()).text(l => l[label] === null || l[label] === undefined ? '' :  _.unescape(l[label])
            );
            this.visuals.twoD.force.alpha(0.01).alphaTarget(0).restart();
        }
    }





    onLinkOpacityChange(e) {

        this.visuals.twoD.commonService.session.style.widgets['link-opacity'] = e;
        let opacity = 1 - e;
        this.visuals.twoD.svg.select('g.links').selectAll('line').attr('opacity', opacity);
    }

    onLinkWidthVariableChange(e) {

        if (e == 'None') {
            $('#link-reciprocalthickness-row').slideUp();
        } else {
            $('#link-reciprocalthickness-row').css('display', 'flex');
        }
        this.visuals.twoD.commonService.session.style.widgets['link-width-variable'] = e;
        this.visuals.twoD.scaleLinkWidth();
    }


    onLinkWidthReciprocalNonReciprocalChange(e) {

        if (e == "Reciprocal") {
            this.visuals.twoD.commonService.session.style.widgets['link-width-reciprocal'] = true;
            this.visuals.twoD.scaleLinkWidth();
        }
        else {
            this.visuals.twoD.commonService.session.style.widgets['link-width-reciprocal'] = false;
            this.visuals.twoD.scaleLinkWidth();

        }
    }

    onLinkWidthChange(e) {

        this.visuals.twoD.commonService.session.style.widgets['link-width'] = e;
        this.visuals.twoD.scaleLinkWidth();

    }

    onLinkLengthChange(e) {

        this.visuals.twoD.force.force('link').distance(e);
        this.visuals.twoD.force.alpha(0.3).alphaTarget(0).restart();
        this.visuals.twoD.commonService.session.style.widgets['link-length'] = e;
    }

    onLinkDirectedUndirectedChange(e) {

        if (e == "Show") {
            this.visuals.twoD.svg.select('g.links').selectAll('line').attr('marker-end', 'url(#end-arrow)');
            this.visuals.twoD.commonService.session.style.widgets['link-directed'] = true;
        }
        else {

            this.visuals.twoD.svg.select('g.links').selectAll('line').attr('marker-end', null);
            this.visuals.twoD.commonService.session.style.widgets['link-directed'] = false;
        }
    }


    onDontHighlightNeighborsHighlightNeighborsChange(e) {

        if (e == "Normal") {
            this.visuals.twoD.commonService.session.style.widgets['node-highlight'] = false;
        }
        else {
            this.visuals.twoD.commonService.session.style.widgets['node-highlight'] = true;
        }
    }

    onNetworkGridlinesShowHideChange(e) {

        if (e == "Show") {

            // Reset width and height in case they have changed
            this.visuals.twoD.halfWidth = $('#network').parent().width() / 2;
            this.visuals.twoD.halfHeight = $('#network').parent().parent().parent().height() / 2;

            this.visuals.twoD.commonService.session.style.widgets['network-gridlines-show'] = true;
            let range = Math.ceil(Math.max(this.visuals.twoD.halfWidth, this.visuals.twoD.halfHeight) / 50);
            let ords = Object.keys(new Array(range).fill(null)).map(parseFloat);
            d3.select('#network g.horizontal-gridlines').selectAll('line').data(ords).enter().append('line')
                .attr('x1', 0)
                .attr('x2', this.visuals.twoD.halfWidth * 2)
                .attr('y1', function (d) { return d * 100; })
                .attr('y2', function (d) { return d * 100; })
                .attr('stroke', 'lightgray');
            d3.select('#network g.vertical-gridlines').selectAll('line').data(ords).enter().append('line')
                .attr('x1', function (d) { return d * 100; })
                .attr('x2', function (d) { return d * 100; })
                .attr('y1', 0)
                .attr('y2', this.visuals.twoD.halfHeight * 2)
                .attr('stroke', 'lightgray');
        }
        else {
            this.visuals.twoD.commonService.session.style.widgets['network-gridlines-show'] = false;
            d3.select('#network g.horizontal-gridlines').html(null);
            d3.select('#network g.vertical-gridlines').html(null);
        }
    }

    onNodeChargeChange(e) {

        this.visuals.twoD.force.force('charge').strength(-e);
        this.visuals.twoD.force.alpha(0.3).alphaTarget(0).restart();
        this.visuals.twoD.commonService.session.style.widgets['node-charge'] = e;
    }

    onNetworkGravityChange(e) {

        this.visuals.twoD.force.force('gravity').strength(e);
        this.visuals.twoD.force.alpha(0.3).alphaTarget(0).restart();
        this.visuals.twoD.commonService.session.style.widgets['network-gravity'] = e;
    }

    onNetworkFrictionChange(e) {

        this.visuals.twoD.force.velocityDecay(e);
        this.visuals.twoD.force.alpha(0.3).alphaTarget(0).restart();
        this.visuals.twoD.commonService.session.style.widgets['network-friction'] = e;
    }

    onNetworkLinkStrengthVariableChange(e) {

        console.log('st change: ', e);
        let v = parseFloat(e);
        this.visuals.twoD.force.force('link').strength(v);
        this.visuals.twoD.force.alpha(0.3).alphaTarget(0).restart();
        this.visuals.twoD.commonService.session.style.widgets['network-link-strength'] = e;
    }


    onNetworkExportFiletypeChange(e) {
        if (e == "svg") {
            this.visuals.twoD.ShowAdvancedExport = false;
        }
        else
            this.visuals.twoD.ShowAdvancedExport = true;
    }

    updateNodeColors() {

        //debugger;

        let variable = this.visuals.twoD.commonService.session.style.widgets['node-color-variable'];
        let nodes = this.visuals.twoD.svg.select('g.nodes').selectAll('g').select('path').data(this.visuals.twoD.commonService.session.network.nodes).classed('selected', d => d.selected);
        let col = this.visuals.twoD.commonService.session.style.widgets['node-color'];

        let stroke = this.visuals.twoD.commonService.session.style.widgets['selected-node-stroke-color'];
        let stroke_width = parseInt(this.visuals.twoD.commonService.session.style.widgets['selected-node-stroke-width']);

        if (variable == 'None') {

            nodes
                .attr('fill', col).attr('opacity', 1);

            // this.context.microbeTrace.clearTable("#node-color-table-bottom");

        } else {
            nodes
                .attr('fill', d => this.visuals.twoD.commonService.temp.style.nodeColorMap(d[variable]))
                .attr('opacity', d => this.visuals.twoD.commonService.temp.style.nodeAlphaMap(d[variable]));

            //  this.context.microbeTrace.generateNodeColorTable("#node-color-table-bottom", false);
        }


        Array.from(nodes._groups).forEach((x: any)=>{
            x.forEach(y=>{
                if(!this.visuals.twoD.commonService.session.data.nodeFilteredValues.find(z => y.__data__.index === z.index)){
                    y.style['opacity'] = 0;
                }
            })
        })

        let _selected: any = this.visuals.twoD.commonService.session.data.nodes.filter(d => d.selected);

        /*/
         * Add a color that shows the node is selected.
        /*/

        if (_selected.length > 0) {

            Array.from(nodes._groups).filter(x => {

                (<any>x).filter(y => {

                    /*/
                     * Turn on the node(s) selected.
                    /*/
                    if (y['__data__'].selected == true) {

                        y.style['stroke'] = stroke;
                        y.style['strokeWidth'] = stroke_width;

                    }
                    else {
                        /*/
                         * Otherwise, turn on the node(s) selected.
                        /*/

                        y.style['stroke'] = "#000000";
                        y.style['strokeWidth'] = this.visuals.twoD.commonService.session.style.widgets['node-border-width'];
                    }
                });
            });
        }
        else {

            //nodes                
            //    .attr('stroke', "#FFFFFF")
            //    .attr('stroke-width', stroke_width)


            Array.from(nodes._groups).filter(x => {

                (<any>x).filter(y => {

                    /*/
                        * Otherwise, turn on the node(s) selected.
                    /*/

                    y.style['stroke'] = "#000000";
                    y.style['strokeWidth'] = this.visuals.twoD.commonService.session.style.widgets['node-border-width'];

                });
            });
        }



    };



    updateLinkColor() {

        let variable = this.visuals.twoD.commonService.session.style.widgets['link-color-variable'];
        // console.log('updating variable: ',variable );
        let links = this.visuals.twoD.svg.select('g.links').selectAll('line');
        if (variable == 'None') {
            let color = this.visuals.twoD.commonService.session.style.widgets['link-color'],
                opacity = 1 - this.visuals.twoD.commonService.session.style.widgets['link-opacity'];
            links
                .attr('stroke', color)
                .attr('opacity', opacity);

            // this.context.microbeTrace.clearTable("#link-color-table-bottom");
        } else {
            // this.context.microbeTrace.generateNodeLinkTable("#link-color-table-bottom", false);

            links
                .data(this.getVLinks())
                .attr('stroke', l => this.visuals.twoD.commonService.temp.style.linkColorMap(l[variable]))
                .attr('opacity', l => this.visuals.twoD.commonService.temp.style.linkAlphaMap(l[variable]))
                .attr('stroke-dasharray', l => {
                    //This quirky little algorithm creates the dasharray code necessary to make dash-y links.
                    let length = 15;
                    let out = new Array(l.origins * 2);
                    let ofs = new Array(l.origins).fill(1);
                    let ons = new Array(l.origins).fill(0);
                    ons[l.oNum] = 1;
                    ofs[l.oNum] = 0;
                    for (let i = 0; i < l.origins; i++) {
                        out[2 * i] = ons[i] * length;
                        out[2 * i + 1] = ofs[i] * length;
                    }
                    return out.join(', ');
                });
        }
    };



    scaleLinkWidth() {
        let scalar = this.visuals.twoD.commonService.session.style.widgets['link-width'];
        let variable = this.visuals.twoD.commonService.session.style.widgets['link-width-variable'];
        let vlinks = this.visuals.twoD.getVLinks();
        let links = this.visuals.twoD.svg.select('g.links').selectAll('line').data(vlinks);
        if (variable == 'None') return links.attr('stroke-width', scalar);
        let n = vlinks.length;
        let max = -Infinity;
        let min = Infinity;
        for (let i = 0; i < n; i++) {
            let l = vlinks[i][variable];
            if (!this.visuals.twoD.isNumber(l)) return;
            if (l > max) max = l;
            if (l < min) min = l;
        }
        let mid = (max - min) / 2 + min;
        let scale = d3.scaleLinear()
            .domain(this.visuals.twoD.commonService.session.style.widgets['link-width-reciprocal'] ? [max, min] : [min, max])
            .range([1, scalar]);
        links.attr('stroke-width', d => {
            let v = d[variable];
            if (!this.visuals.twoD.isNumber(v)) v = mid;
            return scale(v);
        });
    };

    fit(thing, bounds) {

        if (!bounds) bounds = this.visuals.twoD.svg.node().getBBox();
        if (bounds.width == 0 || bounds.height == 0) return; // nothing to fit
        let parent = this.visuals.twoD.svg.node().parentElement.parentElement,
            midX = bounds.x + bounds.width / 2,
            midY = bounds.y + bounds.height / 2;
        let scale = 0.8 / Math.max(bounds.width / parent.parentNode.clientWidth, bounds.height / parent.parentNode.clientHeight);
        const w = parent.parentNode.clientWidth / 2 - midX*scale ;
        const h = parent.parentNode.clientHeight / 2 - midY*scale;
        d3.select('svg#network')
            .transition()
            .duration(750)
            .call(this.visuals.twoD.zoom.transform, d3.zoomIdentity
                .translate(w, h)
                //.translate(parent.parentNode.clientWidth / 2 - midX, parent.parentNode.clientHeight / 2 - midY)
                .scale(scale));
    };

    isFiltered(nodeData: any): boolean{
        if(nodeData){
            return this.visuals.twoD.commonService.session.data.nodeFilteredValues.find(x=>x.index === nodeData.index) !== undefined;
        }
        return true
    }

    openSettings() {

        this.visuals.twoD.Node2DNetworkExportDialogSettings.setVisibility(true);
       this.visuals.twoD.ShowStatistics = !this.visuals.twoD.Show2DSettingsPane;

    }

    enableSettings() {
        this.visuals.twoD.ShowStatistics = !this.visuals.twoD.ShowStatistics;
        this.cdref.detectChanges();
    }

    openExport() {

        this.visuals.microbeTrace.GlobalSettingsDialogSettings.setStateBeforeExport();
        this.visuals.microbeTrace.GlobalSettingsLinkColorDialogSettings.setStateBeforeExport();
        this.visuals.microbeTrace.GlobalSettingsNodeColorDialogSettings.setStateBeforeExport();
        this.visuals.twoD.NodeSymbolTableWrapperDialogSettings.setStateBeforeExport();
        this.visuals.twoD.Node2DNetworkExportDialogSettings.setStateBeforeExport();

        this.isExportClosed = false;
        this.visuals.twoD.Show2DExportPane = true;
    }

    openCenter() {
        this.visuals.twoD.fit(undefined, undefined);
    }

    openPinAllNodes() {

        let nodes = this.visuals.twoD.svg
            .select('g.nodes')
            .selectAll('g')
            .data(this.visuals.twoD.commonService.session.network.nodes)
            .select('path');
        if (this.visuals.twoD.commonService.session.network.allPinned) {
            nodes.each(function (d) {
                delete d.fx;
                delete d.fy;
                d.fixed = false;
            });
            this.visuals.twoD.force.alpha(0.3).alphaTarget(0).restart();
        } else {
            nodes.each(function (d) {
                d.fx = d.x;
                d.fy = d.y;
                d.fixed = true;
            });
        }
        this.visuals.twoD.commonService.session.network.allPinned = !this.visuals.twoD.commonService.session.network.allPinned;
    }

    onRecallSession(){
        //this.loadSettings();
    }

    openRefreshScreen() {
        this.loadSettings();
        setTimeout(this.visuals.twoD.fit, 2000);
    }

    openSelectDataSetScreen() {

    }

    updateVisualization() {
      this.render();
    }

    ngOnDestroy(): void {
        //this.context.twoD.commonService.session.style.widgets['node-label-variable'] = 'None';
    }

    onLoadNewData(){
        this.render();
    }

    onFilterDataChange(){
         this.render(false);
    }

    loadSettings(){
        //this.context.twoD.zoom = null;

        //Polygons|Label
        this.SelectedPolygonLabelVariable = this.visuals.twoD.commonService.session.style.widgets['polygons-label-variable'];
        this.onPolygonLabelVariableChange(this.SelectedPolygonLabelVariable);

        //Polygons|Label Size
        this.SelectedPolygonLabelSizeVariable = this.visuals.twoD.commonService.session.style.widgets['polygons-label-size'];
        this.setPolygonLabelSize(this.SelectedPolygonLabelSizeVariable);

        //Node|Orientation
        this.SelectedPolygonLabelOrientationVariable = this.visuals.twoD.commonService.session.style.widgets['polygons-label-orientation'];
        this.onPolygonLabelOrientationChange(this.SelectedPolygonLabelOrientationVariable);


       //Nodes|Label
        this.SelectedNodeLabelVariable = this.visuals.twoD.commonService.session.style.widgets['node-label-variable'];
        this.onNodeLabelVaribleChange(this.SelectedNodeLabelVariable);

        //Node|Label Size
        this.SelectedNodeLabelSizeVariable = this.visuals.twoD.commonService.session.style.widgets['node-label-size'];
        this.setNodeLabelSize(this.SelectedNodeLabelSizeVariable);

        //Node|Orientation
        this.SelectedNodeLabelOrientationVariable = this.visuals.twoD.commonService.session.style.widgets['node-label-orientation'];
        this.onNodeLabelOrientationChange(this.SelectedNodeLabelOrientationVariable);

        //Nodes|Tooltip
        this.SelectedNodeTooltipVariable = this.visuals.twoD.commonService.session.style.widgets['node-tooltip-variable'];
        this.onNodeTooltipVariableChange(this.SelectedNodeTooltipVariable);

        //Nodes|Shape By Table
        this.SelectedNetworkTableTypeVariable = this.visuals.twoD.commonService.session.style.widgets["node-symbol-table-visible"];
        this.onNodeSymbolTableChange(this.SelectedNetworkTableTypeVariable);

        //Nodes|Shape By
        this.SelectedNodeSymbolVariable = this.visuals.twoD.commonService.session.style.widgets['node-symbol-variable'];
        this.onNodeSymbolVariableChange(this.visuals.twoD.commonService.session.style.widgets['node-symbol-variable'], this.SelectedNetworkTableTypeVariable === "Show");
        

        //Nodes|Shape
        this.SelectedNodeShapeVariable = this.visuals.twoD.commonService.session.style.widgets['node-symbol'];
        this.onNodeSymbolChange(this.SelectedNodeShapeVariable);

        //Nodes|Size By
        this.SelectedNodeRadiusVariable = this.visuals.twoD.commonService.session.style.widgets['node-radius-variable'];
        this.onNodeRadiusVariableChange(this.SelectedNodeRadiusVariable);

        //Nodes|Size
        this.SelectedNodeRadiusSizeVariable = this.visuals.twoD.commonService.session.style.widgets['node-radius'].toString();
        this.onNodeRadiusChange(this.SelectedNodeRadiusSizeVariable);


        //Links|Tooltip
        this.SelectedLinkTooltipVariable = this.visuals.twoD.commonService.session.style.widgets['link-tooltip-variable'];
        this.onLinkTooltipVariableChange(this.SelectedLinkTooltipVariable);

        //Links|Label
        this.SelectedLinkLabelVariable = this.visuals.twoD.commonService.session.style.widgets['link-label-variable'];
        this.onLinkLabelVariableChange(this.SelectedLinkLabelVariable);

        //Links|Transparency
        this.SelectedLinkTransparencyVariable = this.visuals.twoD.commonService.session.style.widgets['link-opacity'];
        this.onLinkOpacityChange(this.SelectedLinkTransparencyVariable);

        //Links|Width By
        this.SelectedLinkWidthByVariable = this.visuals.twoD.commonService.session.style.widgets['link-width-variable'];
        this.onLinkWidthVariableChange(this.SelectedLinkWidthByVariable);

        //Links|Reciprical
        this.SelectedLinkReciprocalTypeVariable = this.visuals.twoD.commonService.session.style.widgets['link-width-reciprocal'] ? "Reciprocal" : "Non-Reciprocal"
        this.onLinkWidthReciprocalNonReciprocalChange(this.SelectedLinkReciprocalTypeVariable);

        //Links|Width
        this.SelectedLinkWidthVariable = this.visuals.twoD.commonService.session.style.widgets['link-width'];
        this.onLinkWidthChange(this.SelectedLinkWidthVariable);

        //Links|Length
        this.SelectedLinkLengthVariable = this.visuals.twoD.commonService.session.style.widgets['link-length'];
        this.onLinkLengthChange(this.SelectedLinkLengthVariable);

        //Links|Arrows
        this.SelectedLinkArrowTypeVariable = this.visuals.twoD.commonService.session.style.widgets['link-directed'] ? "Show" : "Hide";
        this.onLinkDirectedUndirectedChange(this.SelectedLinkArrowTypeVariable); 


        //Network|Neighbors
        this.SelectedNetworkNeighborTypeVariable = this.visuals.twoD.commonService.session.style.widgets['node-highlight'] ? "Highlighted" : "Normal";
        this.onDontHighlightNeighborsHighlightNeighborsChange(this.SelectedNetworkNeighborTypeVariable);

        //Network|Gridlines
        this.SelectedNetworkGridLineTypeVariable = this.visuals.twoD.commonService.session.style.widgets['network-gridlines-show'] ? "Show" : "Hide";
        this.onNetworkGridlinesShowHideChange(this.SelectedNetworkGridLineTypeVariable);

        //Network|Charge
        this.SelectedNetworkChargeVariable = this.visuals.twoD.commonService.session.style.widgets['node-charge'];
        this.onNodeChargeChange(this.SelectedNetworkChargeVariable);

        //Network|Gravity
        this.SelectedNetworkGravityVariable = this.visuals.twoD.commonService.session.style.widgets['network-gravity'];
        this.onNetworkGravityChange(this.SelectedNetworkGravityVariable);

        //Network|Friction
        this.SelectedNetworkFrictionVariable = this.visuals.twoD.commonService.session.style.widgets['network-friction'];
        this.onNetworkFrictionChange(this.SelectedNetworkFrictionVariable);

        //Network|Link Strength
        this.SelecetedNetworkLinkStrengthVariable = this.visuals.twoD.commonService.session.style.widgets['network-link-strength'];
        this.onNetworkFrictionChange(this.SelecetedNetworkLinkStrengthVariable);

    }
}
