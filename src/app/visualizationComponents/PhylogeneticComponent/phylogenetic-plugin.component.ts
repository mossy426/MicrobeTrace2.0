import { Injector, Component, Output, OnChanges, SimpleChange, EventEmitter, OnInit,
  ViewChild, ElementRef, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { EventManager, DOCUMENT } from '@angular/platform-browser';
import { MatMenu } from '@angular/material/menu';
import { CommonService } from '@app/contactTraceCommonServices/common.service';
import * as ClipboardJS from 'clipboard';
import * as saveAs from 'file-saver';
import * as domToImage from 'html-to-image';
import { SelectItem } from 'primeng/api';
import { DialogSettings } from '@app/helperClasses/dialogSettings';
import { MicobeTraceNextPluginEvents } from '@app/helperClasses/interfaces';
import * as _ from 'lodash';
import { MicrobeTraceNextVisuals } from '@app/microbe-trace-next-plugin-visuals';
import { CustomShapes } from '@app/helperClasses/customShapes';
import TidyTree from './tidytree';
import AuspiceHandler from '@app/helperClasses/auspiceHandler';
import * as d3 from 'd3';
import auspiceJson from '@app/helperClasses/auspice_example_formatted.json';


/**
 * @title PhylogeneticComponent
 */
@Component({
  selector: 'PhylogeneticComponent',
  templateUrl: './phylogenetic-plugin.component.html',
  styleUrls: ['./phylogenetic-plugin.component.scss']
})
export class PhylogeneticComponent extends AppComponentBase implements OnInit {

  @Output() DisplayGlobalSettingsDialogEvent = new EventEmitter();
  svgStyle: {} = {
    height: '0px',
    width: '1000px'
  };

  private customShapes: CustomShapes = new CustomShapes();

  ShowNetworkAttributes = false;
  ShowStatistics = false;
  ShowPhylogeneticExportPane = false;
  ShowPhylogeneticSettingsPane = false;
  IsDataAvailable = false;
  svg: any = null;
  settings: any = this.commonService.session.style.widgets;
  halfWidth: any = null;
  halfHeight: any = null;
  transform: any = null;
  force: any = null;
  radToDeg: any = (180 / Math.PI);
  selected: any = null;
  multidrag = false;
  zoom: any = null;
  brush: any = null;
  FieldList: SelectItem[] = [];
  ToolTipFieldList: SelectItem[] = [];


  // Tree Tab
  TreeLayouts: any = [
    { label: 'Horizontal', value: 'horizontal' },
    { label: 'Vertical', value: 'vertical' },
    { label: 'Circular', value: 'circular' },
  ];
  SelectedTreeLayoutVariable = 'horizontal';
  TreeModes: any = [
    { label: 'Smooth', value: 'smooth' },
    { label: 'Square', value: 'square' },
    { label: 'Straight', value: 'straight' },
  ];
  SelectedTreeModeVariable = 'square';
  TreeTypes: any = [
    { label: 'Weighted', value: 'weighted' },
    { label: 'Unweighted (Tree)', value: 'tree' },
    { label: 'Dendrogram', value: 'dendrogram' },
  ];
  SelectedTreeTypeVariable = 'weighted';  // 'weighted';


  // Leaves Tab
  SelectedLeafLabelShowVariable = true;
  SelectedLeafLabelVariable = 'None';
  LeafLabelFieldList: object[] = [];
  SelectedLeafLabelSizeVariable = 12;
  SelectedLeafTooltipShowVariable = true;
  SelectedLeafTooltipVariable = 'id';
  LeafTooltipFieldList: object[] = [];
  SelectedLeafNodeShowVariable = true;
  SelectedLeafNodeSizeVariable = 5;
  SelectedLeafNodeColorVariable = this.settings['node-color'];
  SelectedSelectedLeafNodeColorVariable = this.settings['selected-color'];

  // Branch Tab
  SelectedBranchNodeShowVariable = false;
  SelectedBranchNodeSizeVariable = 5;
  SelectedBranchNodeColorVariable = this.settings['node-color'];
  SelectedBranchSizeVariable = 3;
  SelectedBranchLabelSizeVariable = 12;
  SelectedLinkColorVariable = this.settings['link-color'];
  SelectedBranchLabelShowVariable = false;
  SelectedBranchDistanceShowVariable = false;
  SelectedBranchDistanceSizeVariable = 12;
  SelectedBranchTooltipShowVariable = false;

  hideShowOptions: any = [
    { label: 'Hide', value: false },
    { label: 'Show', value: true }
  ];

  // Export Settings
  private isExportClosed = false;
  public isExporting = false;

  SelectedTreeImageFilenameVariable = 'default_tree';
  SelectedNewickStringFilenameVariable = 'default_tree.nwk';

  NetworkExportFileTypeList: any = [
    { label: 'png', value: 'png' },
    { label: 'jpeg', value: 'jpeg' },
    { label: 'svg', value: 'svg' }
  ];

  SelectedNetworkExportFileTypeListVariable = 'png';
  SelectedNetworkExportScaleVariable: any = 1;
  SelectedNetworkExportQualityVariable: any = 0.92;
  CalculatedResolutionWidth: any = 1918;
  CalculatedResolutionHeight: any = 909;
  CalculatedResolution: any = ((this.CalculatedResolutionWidth * this.SelectedNetworkExportScaleVariable) + ' x ' + (
    this.CalculatedResolutionHeight * this.SelectedNetworkExportScaleVariable) + 'px');


  ShowAdvancedExport = true;

  PhylogeneticTreeExportDialogSettings: DialogSettings = new DialogSettings('#phylotree-settings-pane', false);

  ContextSelectedNodeAttributes: {attribute: string, value: string}[] = [];
  tree: any = null;

  private visuals: MicrobeTraceNextVisuals;


  constructor(injector: Injector,
              private eventManager: EventManager,
              public commonService: CommonService,
              private cdref: ChangeDetectorRef) {

    super(injector);

    this.visuals = commonService.visuals;
    this.commonService.visuals.phylogenetic = this;
  }

  openTree = () => {
    /*
    if (this.visuals.phylogenetic.commonService.session.data.newickString) {
      this.tree = new TidyTree(this.visuals.phylogenetic.commonService.session.data.tree,
                               this.getTreeOptions(),
                               this.getTreeHandlers());
      console.log(this.visuals.phylogenetic.commonService.session.data.tree);
      console.log(this.tree);
      this.hideTooltip();
      this.styleTree();
    } else {
    */
      const newickString = this.commonService.computeTree();
      newickString.then((x) => {
        const tree = this.buildTree(x);
        this.tree = tree;
        this.commonService.visuals.phylogenetic.tree = tree;
        this.hideTooltip();
        this.styleTree();
      });
   // }
  }

  styleTree = () => {
    this.svg = d3.select('#tidytree');
    let nodes = this.visuals.phylogenetic.commonService.session.data;
    nodes = this.svg.select('g.nodes').selectAll('g').data(nodes, d => d.id)
      .join(
        enter => {
          const g = enter.append('g')
            .attr('tabindex', '0')
            .on('mouseenter focusin', (x) => this.showTooltip(x))
            .on('mouseout focusout', (x) => this.hideTooltip())
            .on('contextmenu', (x) => this.showContextMenu(x))
            .on('click', (x) => this.clickHandler(x))
            .on('keydown', n => {
              if (d3.event.code === 'Space') this.clickHandler(n);
              if (d3.event.shiftKey && d3.event.key === 'F10') this.showContextMenu(n);
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
    this.tree.setBranchLabels(this.SelectedBranchLabelShowVariable);
    this.tree.eachBranchLabel(this.styleBranchLabel);
    this.tree.setBranchNodes(this.SelectedBranchNodeShowVariable);
    this.tree.eachBranchNode(this.styleBranchNode);
    this.tree.setBranchDistances(this.SelectedBranchDistanceShowVariable);
    this.tree.eachBranchDistance(this.styleBranchDistance);
    this.tree.setLeafNodes(this.SelectedLeafNodeSizeVariable);
    this.tree.eachLeafNode(this.styleLeafNode);
    this.tree.setLeafLabels(this.SelectedLeafLabelShowVariable);
    this.tree.eachLeafLabel(this.styleLeafLabel);
    const branchEls = document.querySelectorAll('g.tidytree-link > path');
    this.svg.style('height', '88vh;');
    branchEls.forEach(this.styleBranch);
    this.svg.style('background-color', '#ffffff');
  }

  styleBranch = (el) => {
    d3.select(el).style('stroke', this.SelectedLinkColorVariable);
    d3.select(el).style('stroke-width', `${this.SelectedBranchSizeVariable}px`);
  }

  styleBranchLabel = (label, data) => {
    d3.select(label).style('font-size', `${this.SelectedBranchLabelSizeVariable}px`);
  }

  styleBranchNode = (node, data) => {
    d3.select(node).attr('r', this.SelectedLeafNodeSizeVariable);
    d3.select(node).style('fill', this.SelectedLeafNodeColorVariable);
  }

  styleBranchDistance = (label, data) => {
    d3.select(label).style('font-size', `${this.SelectedBranchDistanceSizeVariable}px`);
  }


  styleLeafLabel = (label, data) => {
    d3.select(label).style('font-size', `${this.SelectedLeafLabelSizeVariable}px`);
  }

  styleLeafNode = (node, data) => {
    d3.select(node).attr('r', this.SelectedLeafNodeSizeVariable);
    d3.select(node).style('fill', this.SelectedLeafNodeColorVariable);
  }

  buildTree = (newick) => {
    const tree = new TidyTree(
      newick ? newick : this.tree.data.clone(),
      this.getTreeOptions(),
      this.getTreeHandlers(),
    );
    return tree;
  }

  getTreeOptions = () => {
    const treeOpts = {
      parent: '#phylocanvas',
      layout: this.SelectedTreeLayoutVariable,
      mode: this.SelectedTreeModeVariable,
      type: this.SelectedTreeTypeVariable,
      leafNodes: this.SelectedLeafNodeShowVariable,
      branchNodes:  this.SelectedBranchNodeSizeVariable,
      leafLabels: this.SelectedLeafLabelSizeVariable,
      branchLabels: this.SelectedBranchLabelSizeVariable,
      branchDistances: this.SelectedBranchDistanceSizeVariable,
      ruler: true,
      animation: parseFloat('0'),  // range 0-2000 in steps of 10
      margin: [10, 10, 70, 30]
    };
    return treeOpts;
  }

  getTreeHandlers = () => {
    const handlers = {
      contextmenu: this.showContextMenu,
      showtooltip: this.showTooltip,
      hidetooltip: this.hideTooltip
    };
    return handlers;
  }

  ngOnInit() {
    this.openTree();

  }

  InitView() {
    this.visuals.phylogenetic.IsDataAvailable = (
      this.visuals.phylogenetic.commonService.session.data.nodes.length === 0 ? false : true
    );

    if (this.visuals.phylogenetic.IsDataAvailable === true && this.visuals.phylogenetic.zoom == null) {
      // d3.select('svg#network').exit().remove();
      // this.visuals.phylogenetic.svg = d3.select('svg#network').append('g');

      this.LeafLabelFieldList.push({ label: 'None', value: 'None' });
      this.commonService.session.data['nodeFields'].map((d, i) => {

        this.visuals.phylogenetic.LeafLabelFieldList.push(
          {
            label: this.visuals.phylogenetic.commonService.capitalize(d.replace('_', '')),
            value: d
          });
      });
    }
  }

  openSettings() {
    this.visuals.phylogenetic.PhylogeneticTreeExportDialogSettings.setVisibility(true);
    // this.context.twoD.ShowStatistics = !this.context.twoD.Show2DSettingsPane;
  }


  openExport() {
    this.ShowPhylogeneticExportPane = true;

    this.visuals.microbeTrace.GlobalSettingsDialogSettings.setStateBeforeExport();
    this.visuals.microbeTrace.GlobalSettingsLinkColorDialogSettings.setStateBeforeExport();
    this.visuals.microbeTrace.GlobalSettingsNodeColorDialogSettings.setStateBeforeExport();
    this.isExportClosed = false;

  }

  openCenter() {
    const thisTree = this.commonService.visuals.phylogenetic.tree;
    thisTree.recenter()
      .redraw();
  }

  openPinAllNodes() {


  }

  openRefreshScreen() {

  }

  openSelectDataSetScreen() {

  }

  onTreeLayoutChange(event) {
    this.SelectedTreeLayoutVariable = event;
    this.tree.setLayout(event);
  }

  onTreeModeChange(event) {
    this.SelectedTreeModeVariable = event;
    this.tree.setMode(event);
  }

  onTreeTypeChange(event) {
    this.SelectedTreeTypeVariable = event;
    this.tree.setType(event);
  }

  onLeafLabelVariableChange(event) {
    this.SelectedLeafLabelVariable = event;
  }

  onBranchLabelShowChange(event) {
    this.SelectedBranchLabelShowVariable = event;
    this.tree.setBranchLabels(event);
  }

  onBranchLabelSizeChange(event) {
    this.SelectedBranchLabelSizeVariable = event;
    this.styleTree();
  }

  onBranchDistanceShowChange(event) {
    this.SelectedBranchDistanceShowVariable = event;
    this.tree.setBranchDistances(event);
  }

  onBranchDistanceSizeChange(event) {
    this.SelectedBranchDistanceSizeVariable = event;
    this.styleTree();
  }

  onBranchNodeShowChange(event) {
    this.SelectedBranchNodeShowVariable = event;
    this.tree.setBranchNodes(event);
  }

  onBranchNodeSizeChange(event) {
    this.SelectedBranchNodeSizeVariable = event;
    this.styleTree();
  }

  onBranchTooltipShowChange(event) {
    this.SelectedBranchTooltipShowVariable = event;
  }

  onLeafLabelTooltipShowChange(event) {
    this.SelectedLeafTooltipShowVariable = event;
  }

  onLeafLabelShowChange(event) {
    this.SelectedLeafLabelShowVariable = event;
    this.tree.setLeafLabels(event);
  }

  showGlobalSettings() {
    this.DisplayGlobalSettingsDialogEvent.emit('Styling');
  }

  onLeafSizeChange(event) {
    this.SelectedLeafNodeSizeVariable = event;
    this.styleTree();
  }

  onLeafLabelSizeChange(event) {
    this.SelectedLeafLabelSizeVariable = event;
    this.styleTree();
  }

  onBranchSizeChange(event) {
    this.SelectedBranchSizeVariable = event;
    this.styleTree();
  }

  onCloseExport() {
    this.isExportClosed = true;
  }

  updateNodeColors() {
    const nodeColor = this.visuals.phylogenetic.commonService.session.style.widgets['node-color'];
    this.SelectedLeafNodeColorVariable = nodeColor;
    this.styleTree();
    const selectedColor = this.visuals.phylogenetic.commonService.GlobalSettingsModel.SelectedColorVariable;
  }

  updateLinkColor() {
    const linkColor = this.visuals.phylogenetic.commonService.session.style.widgets['link-color'];
    this.SelectedLinkColorVariable = linkColor;
    this.styleTree();
  }

  saveImage(event) {
    const thisTree = this.commonService.visuals.phylogenetic.tree;
    const fileName = this.SelectedTreeImageFilenameVariable;
    const treeId = 'tidytree';
    const exportImageType = this.SelectedNetworkExportFileTypeListVariable ;
    const content = document.getElementById(treeId);
    if (exportImageType === 'png') {
      domToImage.toPng(content).then(
        dataUrl => {
          saveAs(dataUrl, fileName);
      });
    } else if (exportImageType === 'jpeg') {
        domToImage.toJpeg(content, { quality: 0.85 }).then(
          dataUrl => {
            saveAs(dataUrl, fileName);
          });
    } else if (exportImageType === 'svg') {
        const svgContent = this.visuals.phylogenetic.commonService.unparseSVG(content);
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        saveAs(blob, fileName);
    }

  }

  saveNewickString(event) {
    const thisTree = this.commonService.visuals.phylogenetic.tree;
    const newickBlob = new Blob([thisTree.data.toNewick(false)], {type: 'text/plain;charset=utf-8'});
    saveAs(newickBlob, this.SelectedNewickStringFilenameVariable);
  }


  getContextLeftVal = (xPos) => {
    if (xPos - 175 < 0) {
      return xPos + 25;
    } else {
      return xPos - 175;
    }
  }

  getContextTopVal = (yPos) => {
    if (yPos > (this.svg.clientHeight - 125)) {
      return yPos - 125;
    } else {
      return yPos + 25;
    }
  }

  showContextMenu = (d) => {
    d3.event.preventDefault();
    this.hideTooltip();
    const tree = this.tree;
    const leftVal = this.getContextLeftVal(d3.event.pageX);
    const topVal = this.getContextTopVal(d3.event.pageY);
    d3.select('#phylo-context-menu')
    .style('z-index', 1000)
    .style('display', 'block')
    .style('opacity', 1)
    .style('left', `${leftVal}px`)
    .style('top', `${topVal}px`);
    d3.select('#reroot').on('click', c => {
      tree.setData(d[0].data.reroot());
      this.styleTree();
      this.hideContextMenu();
    });
    d3.select('#rotate').on('click', c => {
      tree.setData(d[0].data.rotate().getRoot());
      this.styleTree();
      this.hideContextMenu();
    });
    d3.select('#flip').on('click', c => {
      tree.setData(d[0].data.flip().getRoot());
      this.styleTree();
      this.hideContextMenu();
    });
    d3.select('#tidytree').on('click', c => {
      this.hideContextMenu();
    });
  }

  hideContextMenu = () => {
    $('#phylo-context-menu').animate({ opacity: 0 }, 80, () => {
      $(this).css('z-index', -1);
    });
  }

  clickHandler = (n) => {
    if (d3.event.ctrlKey) {
      this.visuals.phylogenetic.commonService.session.data.nodes.find(node => node._id === n._id).selected = !n.selected;
    } else {
      this.visuals.phylogenetic.commonService.session.data.nodes.forEach(node => {
        if (node._id === n._id) {
          node.selected = !n.selected;
        } else {
          node.selected = false;
        }
      });
    }
  }

  showTooltip = (d) => {
    if (this.SelectedLeafTooltipShowVariable) {
      const htmlValue: any = this.SelectedLeafTooltipVariable;

      // $('#tooltip').css({ top: d3.event.pageY - 28, left: d3.event.pageX + 8, position: 'absolute' });

      const leftVal = d3.event.pageX + 8;
      const topVal = d3.event.pageY - 28;
      d3.select('#phyloTooltip')
        .html(d[0].data[htmlValue])
        .style('position', 'absolute')
        .style('display', 'block')
        .style('left', `${leftVal}px`)
        .style('top', `${topVal}px`)
        .style('z-index', 1000)
        .transition().duration(100)
        .style('opacity', 1)
        .style('color', '#333333')
        .style('background', '#f5f5f5')
        .style('border', '1px solid #cccccc')
        .style('border-radius', '.25rem')
        .style('padding', '.25rem')
      ;
    }
  }

  hideTooltip = () => {
    const tooltip = d3.select('#phyloTooltip');
    tooltip
      .transition().duration(100)
      .style('opacity', 0)
      .on('end', () => tooltip.style('z-index', -1));
  }

}
