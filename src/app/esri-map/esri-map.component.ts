/*
  Copyright 2019 Esri
  Licensed under the Apache License, Version 2.0 (the 'License');
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an 'AS IS' BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { loadModules } from 'esri-loader';
import esri = __esri; // Esri TypeScript Types

@Component({
  selector: 'app-esri-map',
  templateUrl: './esri-map.component.html',
  styleUrls: ['./esri-map.component.css']
})
export class EsriMapComponent implements OnInit {

  @Output() mapLoadedEvent = new EventEmitter<boolean>();

  // The <div> where we will place the map
  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

  /**
   * _zoom sets map zoom
   * _center sets map center
   * _basemap sets type of map
   * _loaded provides map loaded status
   */
  draw: any;
  esriDraw: any;
  esriGraphic: any;
  private _zoom = 10;
  private _center: Array<number> = [0.1278, 51.5074];
  private _basemap = 'streets';
  private _loaded = false;
  


  get mapLoaded(): boolean {
    return this._loaded;
  }

  @Input()
  set zoom(zoom: number) {
    this._zoom = zoom;
  }

  get zoom(): number {
    return this._zoom;
  }

  @Input()
  set center(center: Array<number>) {
    this._center = center;
  }

  get center(): Array<number> {
    return this._center;
  }

  @Input()
  set basemap(basemap: string) {
    this._basemap = basemap;
  }

  get basemap(): string {
    return this._basemap;
  }

  constructor() { }

  async initializeMap() {
    try {

      // Load the modules for the ArcGIS API for JavaScript
      const [EsriMap, EsriMapView, Graphic, Draw] = await loadModules([
        'esri/Map',
        'esri/views/MapView',
        'esri/Graphic',
        'esri/views/draw/Draw'
      ]);
      this.esriGraphic = Graphic;
      this.esriDraw = Draw;

      // Configure the Map
      const mapProperties: esri.MapProperties = {
        basemap: this._basemap
      };

      const map: esri.Map = new EsriMap(mapProperties);

      // Initialize the MapView
      const mapViewProperties: esri.MapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this._center,
        zoom: this._zoom,
        map: map
      };

      return new EsriMapView(mapViewProperties);

    } catch (error) {
      console.log('EsriLoader: ', error);
    }

  }

  // Finalize a few things once the MapView has been loaded
  houseKeeping(mapView) {
    mapView.when(() => {
      console.log('mapView ready: ', mapView.ready);
      this._loaded = mapView.ready;
      this.mapLoadedEvent.emit(true);
      // Implement PointDrawAction
      this.draw = new this.esriDraw({
        view: mapView
      });
      this.enableCreatePoint(this.draw, mapView);
    });
  }

  // <--- Start
  // https://developers.arcgis.com/javascript/latest/api-reference/esri-views-draw-PointDrawAction.html
  enableCreatePoint(draw, view): void {
    const action = draw.create('point');
    // PointDrawAction.cursor-update
    // Give a visual feedback to users as they move the pointer over the view
    action.on('cursor-update', evt => {
      this.createPointGraphic(evt.coordinates, view);
    });
    // PointDrawAction.draw-complete
    // Create a point when user clicks on the view or presses 'C' key.
    action.on('draw-complete', evt => {
      this.createPointGraphic(evt.coordinates, view);
    });
  }

  createPointGraphic(coordinates, view): void {
    view.graphics.removeAll();
    const point = {
      type: 'point', // autocasts as /Point
      x: coordinates[0],
      y: coordinates[1],
      spatialReference: view.spatialReference
    };
    // this does not work
 // const graphic = new esri.Graphic({
    const graphic = new this.esriGraphic({
      geometry: point,
      symbol: {
        type: 'simple-marker', // autocasts as SimpleMarkerSymbol
        style: 'square',
        color: 'red',
        size: '16px',
        outline: { // autocasts as SimpleLineSymbol
          color: [255, 255, 0],
          width: 3
        }
      }
    });
    view.graphics.add(graphic);
  }
  // END --->

  ngOnInit() {
    // Initialize MapView and return an instance of MapView
    this.initializeMap().then((mapView) => {
      this.houseKeeping(mapView);
    });
  }

}
