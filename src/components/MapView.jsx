import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

// 配置Mapbox访问令牌（需要替换为实际的token）
mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';

function MapView({ style }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // 初始化地图
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [116.4, 39.9], // 默认中心点（北京）
      zoom: 5,
      attributionControl: false
    });

    // 添加导航控件
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // 添加比例尺
    map.addControl(new mapboxgl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }));

    // 地图加载完成事件
    map.on('load', () => {
      console.log('Map loaded successfully');
      
      // 添加示例数据源（实际项目中从数据库加载）
      map.addSource('risk-hazards', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      // 添加风险隐患点图层
      map.addLayer({
        id: 'risk-hazards-points',
        type: 'circle',
        source: 'risk-hazards',
        paint: {
          'circle-radius': 8,
          'circle-color': '#ff0000',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        }
      });
    });

    // 错误处理
    map.on('error', (e) => {
      console.error('Map error:', e);
    });

    mapRef.current = map;

    // 清理函数
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 暴露方法给父组件
  const addRiskHazard = (coordinates, properties = {}) => {
    if (!mapRef.current) return;
    
    const feature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: coordinates
      },
      properties: properties
    };

    const geojson = mapRef.current.getSource('risk-hazards')._data;
    geojson.features.push(feature);
    mapRef.current.getSource('risk-hazards').setData(geojson);
  };

  const clearAllPoints = () => {
    if (!mapRef.current) return;
    
    const geojson = {
      type: 'FeatureCollection',
      features: []
    };
    mapRef.current.getSource('risk-hazards').setData(geojson);
  };

  const flyToLocation = (coordinates, zoom = 12) => {
    if (!mapRef.current) return;
    
    mapRef.current.flyTo({
      center: coordinates,
      zoom: zoom,
      essential: true
    });
  };

  // 将方法暴露给父组件（通过ref）
  React.useImperativeHandle = (ref, () => ({
    addRiskHazard,
    clearAllPoints,
    flyToLocation
  }));

  return (
    <div ref={mapContainerRef} className="map-container" style={style} />
  );
}

export default React.forwardRef(MapView);