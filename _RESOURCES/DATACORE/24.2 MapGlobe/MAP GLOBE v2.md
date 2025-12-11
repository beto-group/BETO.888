---
author: beto.group
name.official: Map Globe v2
price: "0"
category:
  - visualization
tags:
desc:
status: stable
complexity: plug-n-play
ext.dependencies:
id: 24.2
longDesc:
does:
cant:
version.obsidian: 1.4.11
---

### Tab: MapGlobe v2

- **Description**: A dynamic and interactive data visualization component built with D3.js that renders a world map capable of seamlessly transitioning between a 3D orthographic globe and a 2D equirectangular projection. It is designed to plot, cluster, and style geographical data points, representing them as "threats" on the global stage, making it ideal for visualizing geopolitical events, cybersecurity incidents, or other location-based data.
   
- **Does**:

    - **Globe-to-Map Transition**: Features a smooth, zoom-driven transition between a fully interactive 3D globe (on zoom-out) and a 2D flat map (on zoom-in), providing two distinct modes for data exploration.        
    - **Dynamic Data Plotting**: Plots data points ("threats") on the map programmatically. Data can be added by providing latitude/longitude coordinates or by passing an IP address to a globally exposed function (window.addMapThreat).
    - **IP Geolocation**: Includes a built-in utility to geolocate IP addresses using an external API (ipapi.co), automatically converting an IP into geographical coordinates for plotting.
    - **Threat Clustering**: Automatically clusters nearby threat points into a single, larger node with a count, preventing visual clutter in high-density areas and making it easy to identify hotspots.
    - **Risk-Based Styling**: Styles each threat point or cluster based on a "risk" value (0-100), using a color scale that ranges from light pink (safe) to dark purple (danger).
    - **Interactive Controls**: Supports standard map interactions: click-and-drag to rotate the globe and scroll-to-zoom to magnify the map or transition between the globe and flat-map views.
    - **Dependency Loading**: Intelligently loads its own dependencies (D3.js, TopoJSON) from a CDN at runtime, ensuring it works without requiring pre-installation of these libraries.
    - **Built-in Simulation**: Includes a "Simulate Threat" button for demonstration purposes, which adds a random threat to the map from a predefined list of major cities.

- **Can’t**:
   
    - **Fetch or Query Data on its Own**: All data points ("threats") must be added programmatically by calling the global window.addMapThreat function or by clicking the simulation button. It does not read data from Dataview queries or files.    
    - **Persist Data**: All plotted threats are stored in component memory and will be lost when the note is closed or reloaded.
    - **Function Offline**: It requires an active internet connection to load the D3.js and TopoJSON libraries from a CDN, as well as to use the IP geolocation service.
    - **Be Easily Customized Without Editing Code**: The color scheme, map projections, and interaction behaviors are hard-coded within the component and are not configurable via props.
    - **Allow Direct Interaction with Data Points**: The plotted points are for visualization only. They display a tooltip on hover but cannot be clicked to trigger actions or edited directly on the map.


------

![map_globe_24.2.webp](_resources/videos/map_globe_24.2.webm)


![mapglobe_v2_1.webp](_resources/images/mapglobe_v2_1.webp)


![mapglobe_v2_2.webp](_resources/images/mapglobe_v2_2.webp)




### Components

###### [Map Globe Viewer v2](D.q.mapglobe.viewer.v2.md)

###### [Map Globe Component v2](D.q.mapglobe.component.v2.md)
