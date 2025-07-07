---
excalidraw-plugin: parsed
tags:
  - excalidraw
permalink: datacore.flexilis.v04.diagram
excalidraw-open-md: true
---


![[DATACORE.flexilis.v04.diagram.svg]]






```mermaidjs
flowchart TD
%% ====================================================
%% Overall Architecture: Five Major Code Blocks
%% ====================================================
subgraph Overall["Overall Architecture"]
direction TB

%% ----- Block 1: InitialSettings Code Block -----
subgraph IS["InitialSettings Code Block"]
  direction TB
  IS1["Vault & Query Config"]
  IS2["Dynamic Columns Mapping"]
  IS3["Pagination Setup"]
  IS4["Display Options"]
  IS5["UI Placeholders"]
  
  IS1 -->|Sets| IS2
  IS1 -->|Defines| IS3
  IS1 -->|Configures| IS4
  IS1 -->|Provides| IS5
end

%% ----- Block 2: HelperFunctions Code Block -----
subgraph HF["HelperFunctions Code Block"]
  direction LR
  HF1["getProperty()"]
  HF2["extractValue()"]
  HF3["isValidEntry()"]
  HF4["updateFrontmatter()"]
  HF5["truncateTextHelper()"]
  HF6["getColumnType()"]
  
  HF1 -->|Uses| HF3
  HF2 -->|Supports| HF1
  HF4 -->|Modifies| HF1
end

%% ----- Block 3: ViewerStyles Code Block -----
subgraph VS["ViewerStyles Code Block"]
  direction TB
  VS1["getStyles()"]
  VS2["Style Definitions"]
  VS3["Component Layouts"]
  VS4["Dynamic Sizing"]
  
  VS1 -->|Returns| VS2
  VS2 -->|Includes| VS3
  VS3 -->|Handles| VS4
end

%% ----- Block 4: ViewComponent Code Block -----
subgraph VC["ViewComponent Code Block"]
  direction TB
  
  %% Core Functions
  VC1["Settings Merging"]
  VC2["State Management"]
  VC3["Data Querying"]
  
  %% Grouping Logic
  subgraph GRP["Grouping Logic"]
    direction LR
    GRP1["Filter Validation"]
    GRP2["Tree Construction"]
    GRP3["Date Handling"]
    GRP4["Flattening"]
    
    GRP1 --> GRP2
    GRP2 --> GRP3
    GRP3 --> GRP4
  end
  
  %% Pagination Logic
  subgraph PAG["Pagination Logic"]
    direction LR
    PAG1["Row Filtering"]
    PAG2["Data Slicing"]
    PAG3["Header Inclusion"]
    PAG4["Page Calc"]
    
    PAG1 --> PAG2
    PAG2 --> PAG3
    PAG3 --> PAG4
  end
  
  %% File Operations
  subgraph FO["File Operations"]
    direction LR
    FO1["onUpdateEntry()"]
    FO2["onDeleteEntry()"]
    FO3["Content Parsing"]
    
    FO1 --> FO3
    FO2 --> FO3
  end
  
  VC1 --> VC2
  VC2 --> VC3
  VC3 --> GRP
  GRP --> PAG
  PAG --> FO
end

%% ----- Block 5: Components Code Block -----
subgraph CP["Components Code Block"]
  direction TB
  
  %% Core Components
  CP1["DisplaySettingsEditor"]
  CP2["DraggableLink"]
  CP3["EditableCell"]
  
  %% Table Structure
  subgraph TABLE["Table System"]
    direction LR
    T1["DataTable"]
    T2["RenderRows"]
    T3["TableCell"]
    
    T1 --> T2
    T2 --> T3
  end
  
  %% Editing Tools
  subgraph EDIT["Editing Tools"]
    direction LR
    E1["EditColumnBlock"]
    E2["AddColumn"]
    E3["Column Reordering"]
    
    E1 --> E2
    E2 --> E3
  end
  
  %% Pagination UI
  CP7["Pagination Controls"]
  
  CP3 --> TABLE
  EDIT --> CP3
end

end

%% ====================================================
%% Enhanced Connections
%% ====================================================
%% Configuration Flow
IS -->|Provides Config| VC1;

%% Style Application
VS -->|Styles| VC;
VS -->|Styles| CP;

%% Data Processing
HF -->|Supports| VC3;
HF -->|Supports| CP3;
VC3 -->|Processed Data| GRP;
GRP -->|Structured Data| PAG;
PAG -->|Paginated Data| TABLE;

%% User Interactions
CP2 -->|Drag Events| FO;
CP3 -->|Edits| FO1;
EDIT -->|Column Changes| IS2;

%% State Management
VC2 -->|Controls| PAG;
VC2 -->|Controls| EDIT;
VC2 -->|Triggers| VC3;

%% Style Application (continued)
VS1 -->|Theming| TABLE;
VS1 -->|Theming| EDIT;
VS4 -->|Responsive Layout| CP7;

%% Error Handling
FO3 -->|Validation| HF3;
HF3 -->|Data Filtering| GRP1;

%% Specialized Connections
CP7 -->|Page Controls| PAG4;
E3 -->|Order Updates| IS2;
T3 -->|Rendering| HF6;

```

==⚠  Switch to EXCALIDRAW VIEW in the MORE OPTIONS menu of this document. ⚠== You can decompress Drawing data with the command palette: 'Decompress current Excalidraw file'. For more info check in plugin settings under 'Saving'


# Excalidraw Data

## Text Elements
Overall Architecture ^9ZmmV09k

Components Code Block ^nLtdnWr3

Editing Tools ^4NG7tybl

Table System ^dXThINhV

ViewComponent Code Block ^vYswF3q8

File Operations ^8E8tTmzv

Pagination Logic ^LpWEDWrk

Grouping Logic ^fwZaNriF

ViewerStyles Code Block ^ohBBP6bU

HelperFunctions Code Block ^GkksJITl

InitialSettings Code Block ^HdAhJAO5

Vault & Query Config ^OJcONuQl

Dynamic Columns Mapping ^BEbOYnHD

Pagination Setup ^ggV28GI6

Display Options ^I3EfG93A

UI Placeholders ^1xvTpp9q

getProperty() ^EtWw0PCz

extractValue() ^UY0ov7u3

isValidEntry() ^pA7zH5xk

updateFrontmatter() ^StFXHUEv

truncateTextHelper() ^H4AzWD40

getColumnType() ^ZRkaVeig

getStyles() ^JdNAD3AF

Style Definitions ^cbGiqQzo

Component Layouts ^6g6mIp2K

Dynamic Sizing ^aCGQ8fwT

Settings Merging ^qRMMF9dW

State Management ^Cw4sWNjZ

Data Querying ^a9JVyxB6

Filter Validation ^qW6LHMao

Tree Construction ^wQhSD5pe

Date Handling ^Xm04KmlF

Flattening ^Fuu0sEai

Row Filtering ^HYo8bvfz

Data Slicing ^kpP4XUuG

Header Inclusion ^KDpUfoD2

Page Calc ^Iw3TooVk

onUpdateEntry() ^XVoCp5h4

onDeleteEntry() ^uFmrJ3vD

Content Parsing ^OvmxdUBm

DisplaySettingsEditor ^TSXhHTVf

DraggableLink ^yeT5pfx6

EditableCell ^YfeipMef

DataTable ^1AyHANYf

RenderRows ^l5QOIoHq

TableCell ^TuaTy2EL

EditColumnBlock ^8CS6SXpg

AddColumn ^UTpKi1cx

Column Reordering ^AYS2IBN9

Pagination Controls ^bDVHoljj

Sets ^o9UuYcOz

Defines ^A5g90yv1

Configures ^eJlTdalo

Provides ^0fgqHlh7

Uses ^wPmgfDJi

Supports ^GgVVouD4

Modifies ^1a4Pzw48

Returns ^NfdsXdDW

Includes ^7zTwSZN5

Handles ^Qfj2N16A

Provides Config ^u7hpUtn7

Styles ^L7pZEcIZ

Styles ^7MXPjehI

Supports ^MfV2XdAz

Supports ^FbKiSIF2

Processed Data ^QwIrfB89

Structured Data ^f1zJNC2m

Paginated Data ^C2ZwPFbO

Drag Events ^1wbrNwMk

Edits ^yH88vT17

Column Changes ^baNXB1Rh

Controls ^3PD0wdjl

Controls ^OlyOeNVy

Triggers ^MO9rPr1D

Theming ^IFQRLfsN

Theming ^9DYXpUto

Responsive Layout ^Gb2obMvb

Validation ^uN1Hiqn1

Data Filtering ^ER9EUJ24

Page Controls ^8mQZ1P41

Order Updates ^IHzrEHZv

Rendering ^jiMqSZeO

%%
## Drawing
```json
{
	"type": "excalidraw",
	"version": 2,
	"source": "https://github.com/zsviczian/obsidian-excalidraw-plugin/releases/tag/2.8.2",
	"elements": [
		{
			"id": "vERE8nM_-dpYsvchdp9Ec",
			"type": "rectangle",
			"x": -2429.004638671875,
			"y": -792.4324340820312,
			"width": 4858.00927734375,
			"height": 1584.8648681640625,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "a0",
			"roundness": null,
			"seed": 134425485,
			"version": 13,
			"versionNonce": 1915490019,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "9ZmmV09k"
				}
			],
			"updated": 1742269743162,
			"link": null,
			"locked": false
		},
		{
			"id": "nYNmKjIbl5ScmFOA9qcUg",
			"type": "rectangle",
			"x": -1430.5021209716797,
			"y": -327.47745513916016,
			"width": 1170.9295654296875,
			"height": 939.9249267578125,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "a1",
			"roundness": null,
			"seed": 319828461,
			"version": 22,
			"versionNonce": 1412315779,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "nLtdnWr3"
				},
				{
					"id": "iktjHotKfcXMxguPVp4ET",
					"type": "arrow"
				}
			],
			"updated": 1742269743162,
			"link": null,
			"locked": false
		},
		{
			"id": "_RbMwjcoSPopxOXLE0M4S",
			"type": "rectangle",
			"x": -1410.5021209716797,
			"y": -302.47745513916016,
			"width": 408.789794921875,
			"height": 432.46246337890625,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"H_M7mu7RTfI-Uam1h8jlD",
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "a2",
			"roundness": null,
			"seed": 393047117,
			"version": 29,
			"versionNonce": 2016014883,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "4NG7tybl"
				},
				{
					"id": "PI3nen3PcOo4dos0be0tP",
					"type": "arrow"
				},
				{
					"id": "5bj4bt_UyYAbhtn4gKxQ0",
					"type": "arrow"
				},
				{
					"id": "OBKMBnGMOruKoV4rXPJIP",
					"type": "arrow"
				},
				{
					"id": "c_WP35ptJL5kUzAhZt_3s",
					"type": "arrow"
				}
			],
			"updated": 1742269743162,
			"link": null,
			"locked": false
		},
		{
			"id": "rc_2zfag79_m4gVSsVFft",
			"type": "rectangle",
			"x": -1081.1050262451172,
			"y": 212.47752380371094,
			"width": 218.7855224609375,
			"height": 374.969970703125,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"mw079WuoWV3HJLBrAaMgP",
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "a3",
			"roundness": null,
			"seed": 1693735597,
			"version": 30,
			"versionNonce": 2131604931,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "dXThINhV"
				},
				{
					"id": "kukjkK_k3laMWYhBXqw7d",
					"type": "arrow"
				},
				{
					"id": "4_Wludr31gnxxpd0K4S3A",
					"type": "arrow"
				},
				{
					"id": "94oC8ZUWBBYfTqWfH4zfd",
					"type": "arrow"
				}
			],
			"updated": 1742269743162,
			"link": null,
			"locked": false
		},
		{
			"id": "0pPVe1x2WqqSdxvLxeap8",
			"type": "rectangle",
			"x": 328.01409339904785,
			"y": -612.4474411010742,
			"width": 1484.71533203125,
			"height": 1224.89501953125,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "a4",
			"roundness": null,
			"seed": 340688141,
			"version": 18,
			"versionNonce": 1744307555,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "vYswF3q8"
				},
				{
					"id": "NkEQcmmOXFiqCO_w02ePC",
					"type": "arrow"
				}
			],
			"updated": 1742269743162,
			"link": null,
			"locked": false
		},
		{
			"id": "TaeRTxNLHvJEpplT6a_6R",
			"type": "rectangle",
			"x": 1279.5779647827148,
			"y": 212.47752380371094,
			"width": 513.151611328125,
			"height": 219.9849853515625,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"g7-OaCcoEofh5wslqelOr",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "a5",
			"roundness": null,
			"seed": 1828017005,
			"version": 21,
			"versionNonce": 1245143299,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "8E8tTmzv"
				},
				{
					"id": "p0TKb2ucN-oItF7biLZoC",
					"type": "arrow"
				},
				{
					"id": "9yRHANyal3iTqiJcYPhXz",
					"type": "arrow"
				}
			],
			"updated": 1742269743162,
			"link": null,
			"locked": false
		},
		{
			"id": "EX9tduE9P4El2CFh-GPBs",
			"type": "rectangle",
			"x": 348.01409339904785,
			"y": 32.492530822753906,
			"width": 344.540283203125,
			"height": 554.9548950195312,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"zk0wQlgc45-JaPCRpRnFu",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "a6",
			"roundness": null,
			"seed": 187850189,
			"version": 28,
			"versionNonce": 1330268323,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "LpWEDWrk"
				},
				{
					"id": "oSZtyzwGfm--O9uAOOYc8",
					"type": "arrow"
				},
				{
					"id": "9yRHANyal3iTqiJcYPhXz",
					"type": "arrow"
				},
				{
					"id": "4OUCC0iiWe5HpCoDnZ8Ed",
					"type": "arrow"
				},
				{
					"id": "4_Wludr31gnxxpd0K4S3A",
					"type": "arrow"
				},
				{
					"id": "PZ3wYrFtRseHuwe8ppnxb",
					"type": "arrow"
				}
			],
			"updated": 1742269743162,
			"link": null,
			"locked": false
		},
		{
			"id": "i2wIJt5dXvPxeXkhJ3oaz",
			"type": "rectangle",
			"x": 712.5543766021729,
			"y": -122.49246215820312,
			"width": 547.0234375,
			"height": 554.9550170898438,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"SzDsw0RdvM1MXjcViO4vw",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "a7",
			"roundness": null,
			"seed": 1176443949,
			"version": 29,
			"versionNonce": 1826569283,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "fwZaNriF"
				},
				{
					"id": "oSZtyzwGfm--O9uAOOYc8",
					"type": "arrow"
				},
				{
					"id": "37ROiDyu3zF3WhhVK4Omr",
					"type": "arrow"
				},
				{
					"id": "_HXvwDZoBII3iJW1Cy8Uu",
					"type": "arrow"
				},
				{
					"id": "4OUCC0iiWe5HpCoDnZ8Ed",
					"type": "arrow"
				}
			],
			"updated": 1742269743162,
			"link": null,
			"locked": false
		},
		{
			"id": "xn3CuZNjrq493cpDUThZH",
			"type": "rectangle",
			"x": -239.57266807556152,
			"y": -767.4324340820312,
			"width": 547.586669921875,
			"height": 562.447509765625,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"qOFZUrLzmmUOzUyD87g3u",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "a8",
			"roundness": null,
			"seed": 1436880525,
			"version": 21,
			"versionNonce": 1591000035,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "ohBBP6bU"
				},
				{
					"id": "NkEQcmmOXFiqCO_w02ePC",
					"type": "arrow"
				},
				{
					"id": "iktjHotKfcXMxguPVp4ET",
					"type": "arrow"
				}
			],
			"updated": 1742269743162,
			"link": null,
			"locked": false
		},
		{
			"id": "KR3Gd4hKNX-6c6ls9LF13",
			"type": "rectangle",
			"x": 1832.729393005371,
			"y": -612.4474411010742,
			"width": 576.27490234375,
			"height": 1379.8798828125,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"hyAIBtDxURJh_BSk11hdC",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "a9",
			"roundness": null,
			"seed": 947762413,
			"version": 21,
			"versionNonce": 1631143811,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "GkksJITl"
				},
				{
					"id": "fwlmycFCjo666ejf9fxaV",
					"type": "arrow"
				},
				{
					"id": "eDmyCbqC4ht4Is3zorGPs",
					"type": "arrow"
				}
			],
			"updated": 1742269743162,
			"link": null,
			"locked": false
		},
		{
			"id": "i0LLNFRk6PdTV01ue_zkK",
			"type": "rectangle",
			"x": -2409.004638671875,
			"y": -767.4324340820312,
			"width": 958.5025024414062,
			"height": 1077.4024658203125,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"b069iyLJOd9Dsf92UvXNF",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aA",
			"roundness": null,
			"seed": 1513262925,
			"version": 18,
			"versionNonce": 709582627,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "HdAhJAO5"
				},
				{
					"id": "kj2u5EmSLawPu0DnbbPGA",
					"type": "arrow"
				}
			],
			"updated": 1742269743162,
			"link": null,
			"locked": false
		},
		{
			"id": "RHwh8wll1V-3w4O5eG8TZ",
			"type": "rectangle",
			"x": -1922.4724292755127,
			"y": -742.4324340820312,
			"width": 249.2227020263672,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"b069iyLJOd9Dsf92UvXNF",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aB",
			"roundness": null,
			"seed": 2031951277,
			"version": 29,
			"versionNonce": 611943107,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "OJcONuQl"
				},
				{
					"id": "tIqzzdMTvP-OxIiJCe0Xx",
					"type": "arrow"
				},
				{
					"id": "1rV2FrN8Qd60I_hNOKdQ7",
					"type": "arrow"
				},
				{
					"id": "ZuHwpiI2rEqXGZ90O0xtT",
					"type": "arrow"
				},
				{
					"id": "LqDWplcBsB7j3F35c_tHH",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "2qvm5Jun-e8fqcl4Oex7s",
			"type": "rectangle",
			"x": -1817.3215026855469,
			"y": 237.47752380371094,
			"width": 310.7701721191406,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"b069iyLJOd9Dsf92UvXNF",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aC",
			"roundness": null,
			"seed": 1281810445,
			"version": 24,
			"versionNonce": 1751265891,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "BEbOYnHD"
				},
				{
					"id": "tIqzzdMTvP-OxIiJCe0Xx",
					"type": "arrow"
				},
				{
					"id": "5bj4bt_UyYAbhtn4gKxQ0",
					"type": "arrow"
				},
				{
					"id": "ncdAUnDbcow1ZgL9fcuHu",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "oh2JBXHvVuewF5iUs_OBV",
			"type": "rectangle",
			"x": -2374.004638671875,
			"y": -587.4474411010742,
			"width": 202.1813201904297,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"b069iyLJOd9Dsf92UvXNF",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aD",
			"roundness": null,
			"seed": 1778996845,
			"version": 18,
			"versionNonce": 1993600515,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "ggV28GI6"
				},
				{
					"id": "1rV2FrN8Qd60I_hNOKdQ7",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "ILh3Hut3t2HObQo-XyQFH",
			"type": "rectangle",
			"x": -2121.8233184814453,
			"y": -587.4474411010742,
			"width": 186.88360595703125,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"b069iyLJOd9Dsf92UvXNF",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aE",
			"roundness": null,
			"seed": 1825439949,
			"version": 18,
			"versionNonce": 852309411,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "I3EfG93A"
				},
				{
					"id": "ZuHwpiI2rEqXGZ90O0xtT",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "jzPCB6T4M3Oro9M2yzRmp",
			"type": "rectangle",
			"x": -1884.939712524414,
			"y": -587.4474411010742,
			"width": 188.0032958984375,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"b069iyLJOd9Dsf92UvXNF",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aF",
			"roundness": null,
			"seed": 1515085613,
			"version": 18,
			"versionNonce": 461146435,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "1xvTpp9q"
				},
				{
					"id": "LqDWplcBsB7j3F35c_tHH",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "MgqlX2Yy00CDM5SDyF0Q0",
			"type": "rectangle",
			"x": 2086.3678016662598,
			"y": -457.4624481201172,
			"width": 164.87486267089844,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"hyAIBtDxURJh_BSk11hdC",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aG",
			"roundness": null,
			"seed": 1223946637,
			"version": 22,
			"versionNonce": 1178626275,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "EtWw0PCz"
				},
				{
					"id": "555JFpA1LVe-bAUd-WOrH",
					"type": "arrow"
				},
				{
					"id": "qxNNAKBx-GBM05cSZgrK9",
					"type": "arrow"
				},
				{
					"id": "5U-r2iLIYnP-gCw2NspkM",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "ht05Sv4Wu8q8RxH9efHP8",
			"type": "rectangle",
			"x": 2182.5386505126953,
			"y": -587.4474411010742,
			"width": 175.0947265625,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"hyAIBtDxURJh_BSk11hdC",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aH",
			"roundness": null,
			"seed": 1173895149,
			"version": 18,
			"versionNonce": 413619331,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "UY0ov7u3"
				},
				{
					"id": "5U-r2iLIYnP-gCw2NspkM",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "sfDRCF8wXoCpiLY0q6ZfO",
			"type": "rectangle",
			"x": 2210.1066360473633,
			"y": 514.9550132751465,
			"width": 163.89779663085938,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"hyAIBtDxURJh_BSk11hdC",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aI",
			"roundness": null,
			"seed": 2070196813,
			"version": 22,
			"versionNonce": 1114623011,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "pA7zH5xk"
				},
				{
					"id": "vJyx8Jye5-uxK7204eyoA",
					"type": "arrow"
				},
				{
					"id": "qxNNAKBx-GBM05cSZgrK9",
					"type": "arrow"
				},
				{
					"id": "0VWYbEbtlwYDAk6_svx8L",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "0T6eB7YBOr50H7rttPChY",
			"type": "rectangle",
			"x": 1884.1004486083984,
			"y": -587.4474411010742,
			"width": 248.43820190429688,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"hyAIBtDxURJh_BSk11hdC",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aJ",
			"roundness": null,
			"seed": 370335917,
			"version": 16,
			"versionNonce": 2005422019,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "StFXHUEv"
				},
				{
					"id": "555JFpA1LVe-bAUd-WOrH",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "vAL2uYPlIXg7f8nRNBAvs",
			"type": "rectangle",
			"x": 2122.5209579467773,
			"y": 694.9400062561035,
			"width": 251.4834747314453,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"hyAIBtDxURJh_BSk11hdC",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aK",
			"roundness": null,
			"seed": 1806451469,
			"version": 15,
			"versionNonce": 1779392355,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "H4AzWD40"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "i8FxVBqeKW52TEoN5icPm",
			"type": "rectangle",
			"x": 1867.729393005371,
			"y": 694.9400062561035,
			"width": 204.79156494140625,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"hyAIBtDxURJh_BSk11hdC",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aL",
			"roundness": null,
			"seed": 1621776749,
			"version": 18,
			"versionNonce": 72579843,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "ZRkaVeig"
				},
				{
					"id": "nPjDzw9tpU_BMjFxXjiQa",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "O01GpUqj0dpcdpGeHI9Y_",
			"type": "rectangle",
			"x": -85.70477104187012,
			"y": -742.4324340820312,
			"width": 134.84996032714844,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"qOFZUrLzmmUOzUyD87g3u",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aM",
			"roundness": null,
			"seed": 240559053,
			"version": 24,
			"versionNonce": 1658004131,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "JdNAD3AF"
				},
				{
					"id": "pS0t-bX6iYs75i8NkzuJZ",
					"type": "arrow"
				},
				{
					"id": "94oC8ZUWBBYfTqWfH4zfd",
					"type": "arrow"
				},
				{
					"id": "c_WP35ptJL5kUzAhZt_3s",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "AcKmThWP1QtdVlTb6DjdA",
			"type": "rectangle",
			"x": 56.39087104797363,
			"y": -587.4474411010742,
			"width": 198.1589813232422,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"qOFZUrLzmmUOzUyD87g3u",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aN",
			"roundness": null,
			"seed": 684368429,
			"version": 19,
			"versionNonce": 238868035,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "cbGiqQzo"
				},
				{
					"id": "JEN4Z3KAgTvZ_KF_KxMn5",
					"type": "arrow"
				},
				{
					"id": "pS0t-bX6iYs75i8NkzuJZ",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "Ec02pJ26mWo9nPFgqDjAh",
			"type": "rectangle",
			"x": 37.9266300201416,
			"y": -457.4624481201172,
			"width": 235.08746337890625,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"qOFZUrLzmmUOzUyD87g3u",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aO",
			"roundness": null,
			"seed": 619697293,
			"version": 19,
			"versionNonce": 1970214371,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "6g6mIp2K"
				},
				{
					"id": "JEN4Z3KAgTvZ_KF_KxMn5",
					"type": "arrow"
				},
				{
					"id": "pWqEWKkgPIm81JJ438V4s",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "gnxdKremyYJcvEZhRAxwI",
			"type": "rectangle",
			"x": 64.6708927154541,
			"y": -277.47745513916016,
			"width": 181.59893798828125,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"qOFZUrLzmmUOzUyD87g3u",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aP",
			"roundness": null,
			"seed": 511687405,
			"version": 19,
			"versionNonce": 662200707,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "aCGQ8fwT"
				},
				{
					"id": "1FLh6jFTad8n_v7Q2KuWc",
					"type": "arrow"
				},
				{
					"id": "pWqEWKkgPIm81JJ438V4s",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "PutVtMjXFW4CxbATlLTt-",
			"type": "rectangle",
			"x": 546.9289112091064,
			"y": -587.4474411010742,
			"width": 198.4442596435547,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aQ",
			"roundness": null,
			"seed": 2114180429,
			"version": 21,
			"versionNonce": 1301756195,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "qRMMF9dW"
				},
				{
					"id": "PCqgfHJXHFiEJ_f_HXIbv",
					"type": "arrow"
				},
				{
					"id": "kj2u5EmSLawPu0DnbbPGA",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "-K6jX1nqRu8UJHIunl10l",
			"type": "rectangle",
			"x": 534.6729068756104,
			"y": -457.4624481201172,
			"width": 222.95626831054688,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aR",
			"roundness": null,
			"seed": 1591059373,
			"version": 30,
			"versionNonce": 1698307267,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "Cw4sWNjZ"
				},
				{
					"id": "PCqgfHJXHFiEJ_f_HXIbv",
					"type": "arrow"
				},
				{
					"id": "jx_ElHDTaL_J-WMq6HQzl",
					"type": "arrow"
				},
				{
					"id": "PZ3wYrFtRseHuwe8ppnxb",
					"type": "arrow"
				},
				{
					"id": "OBKMBnGMOruKoV4rXPJIP",
					"type": "arrow"
				},
				{
					"id": "d_ZwPkuCNg_NCBlX2J5wZ",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "X_hrR9Uye6ILBoShzyOfk",
			"type": "rectangle",
			"x": 853.3270435333252,
			"y": -277.47745513916016,
			"width": 173.6184539794922,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aS",
			"roundness": null,
			"seed": 891201037,
			"version": 30,
			"versionNonce": 973048931,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "a9JVyxB6"
				},
				{
					"id": "jx_ElHDTaL_J-WMq6HQzl",
					"type": "arrow"
				},
				{
					"id": "37ROiDyu3zF3WhhVK4Omr",
					"type": "arrow"
				},
				{
					"id": "fwlmycFCjo666ejf9fxaV",
					"type": "arrow"
				},
				{
					"id": "_HXvwDZoBII3iJW1Cy8Uu",
					"type": "arrow"
				},
				{
					"id": "d_ZwPkuCNg_NCBlX2J5wZ",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "XK78bn_EZJAAPlFPCz68w",
			"type": "rectangle",
			"x": 842.6614322662354,
			"y": -97.49246215820312,
			"width": 194.94967651367188,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"SzDsw0RdvM1MXjcViO4vw",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aT",
			"roundness": null,
			"seed": 869817453,
			"version": 23,
			"versionNonce": 532023299,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "qW6LHMao"
				},
				{
					"id": "8ObQjvx7LSndKi2tmnvl5",
					"type": "arrow"
				},
				{
					"id": "0VWYbEbtlwYDAk6_svx8L",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "qM994QmPe72J2xQJLfeoe",
			"type": "rectangle",
			"x": 843.5291614532471,
			"y": 57.492530822753906,
			"width": 213.21421813964844,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"SzDsw0RdvM1MXjcViO4vw",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aU",
			"roundness": null,
			"seed": 1925990093,
			"version": 23,
			"versionNonce": 1817972643,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "wQhSD5pe"
				},
				{
					"id": "8ObQjvx7LSndKi2tmnvl5",
					"type": "arrow"
				},
				{
					"id": "zjeyYmJ_Olcaz1N6Xudc2",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "jqFXmP318lDWl6YaQOvIn",
			"type": "rectangle",
			"x": 863.9689121246338,
			"y": 237.47752380371094,
			"width": 172.334716796875,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"SzDsw0RdvM1MXjcViO4vw",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aV",
			"roundness": null,
			"seed": 1418978605,
			"version": 21,
			"versionNonce": 840966979,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "Xm04KmlF"
				},
				{
					"id": "ZATzAEsADfBSjpELTeZ0O",
					"type": "arrow"
				},
				{
					"id": "zjeyYmJ_Olcaz1N6Xudc2",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "F7J50ub-BOxa-Jp12HqTK",
			"type": "rectangle",
			"x": 885.5925388336182,
			"y": 359.97002029418945,
			"width": 129.08746337890625,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"SzDsw0RdvM1MXjcViO4vw",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aW",
			"roundness": null,
			"seed": 748205965,
			"version": 18,
			"versionNonce": 962642659,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "Fuu0sEai"
				},
				{
					"id": "ZATzAEsADfBSjpELTeZ0O",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "4JCqqjSydFFi1fons0WWW",
			"type": "rectangle",
			"x": 467.5759906768799,
			"y": 57.492530822753906,
			"width": 162.31454467773438,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"zk0wQlgc45-JaPCRpRnFu",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aX",
			"roundness": null,
			"seed": 622083565,
			"version": 20,
			"versionNonce": 984379011,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "HYo8bvfz"
				},
				{
					"id": "uYX9SdPKsycPC0sOw1eRW",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "e2orvQeBvm4UYCdZZuApB",
			"type": "rectangle",
			"x": 483.76834297180176,
			"y": 237.47752380371094,
			"width": 146.28224182128906,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"zk0wQlgc45-JaPCRpRnFu",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aY",
			"roundness": null,
			"seed": 1695545421,
			"version": 21,
			"versionNonce": 1489085987,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "kpP4XUuG"
				},
				{
					"id": "LtrE2cybvgslFolNvXv7H",
					"type": "arrow"
				},
				{
					"id": "uYX9SdPKsycPC0sOw1eRW",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "aX29HCHmoz9fC3hXd11Gh",
			"type": "rectangle",
			"x": 456.2645511627197,
			"y": 359.97002029418945,
			"width": 201.28982543945312,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"zk0wQlgc45-JaPCRpRnFu",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aZ",
			"roundness": null,
			"seed": 1986356909,
			"version": 19,
			"versionNonce": 1519315395,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "KDpUfoD2"
				},
				{
					"id": "LtrE2cybvgslFolNvXv7H",
					"type": "arrow"
				},
				{
					"id": "6O6xXzvLMnpXv-weLCKjr",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "9BMk73-8-UHV4lmnYE9dt",
			"type": "rectangle",
			"x": 495.68202018737793,
			"y": 514.9550132751465,
			"width": 122.45487976074219,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"zk0wQlgc45-JaPCRpRnFu",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aa",
			"roundness": null,
			"seed": 1807616269,
			"version": 21,
			"versionNonce": 624081251,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "Iw3TooVk"
				},
				{
					"id": "6O6xXzvLMnpXv-weLCKjr",
					"type": "arrow"
				},
				{
					"id": "YzRqsPOhHHag4KVeavDTV",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "lVmfzqjMLYeNX1irRQdtg",
			"type": "rectangle",
			"x": 1557.5378646850586,
			"y": 237.47752380371094,
			"width": 200.1915283203125,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"g7-OaCcoEofh5wslqelOr",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "ab",
			"roundness": null,
			"seed": 1184063341,
			"version": 21,
			"versionNonce": 1979421955,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "XVoCp5h4"
				},
				{
					"id": "sHE-S98XgCwml0SskWQw7",
					"type": "arrow"
				},
				{
					"id": "iekKZp05e4wU-Hd1GSrnv",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "QtUwW_vY4_8RmierPK5q2",
			"type": "rectangle",
			"x": 1314.5779647827148,
			"y": 237.47752380371094,
			"width": 192.95989990234375,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"g7-OaCcoEofh5wslqelOr",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "ac",
			"roundness": null,
			"seed": 489613773,
			"version": 18,
			"versionNonce": 1550318755,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "uFmrJ3vD"
				},
				{
					"id": "sZIULodKyBnaT3_kaeFnF",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "3NE-4xvz3SJO0togIL87C",
			"type": "rectangle",
			"x": 1468.5701332092285,
			"y": 359.97002029418945,
			"width": 190.7561798095703,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"g7-OaCcoEofh5wslqelOr",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "ad",
			"roundness": null,
			"seed": 11151405,
			"version": 20,
			"versionNonce": 1948676163,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "OvmxdUBm"
				},
				{
					"id": "sHE-S98XgCwml0SskWQw7",
					"type": "arrow"
				},
				{
					"id": "sZIULodKyBnaT3_kaeFnF",
					"type": "arrow"
				},
				{
					"id": "vJyx8Jye5-uxK7204eyoA",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "ypQnnrraBfl3x57HnSSY6",
			"type": "rectangle",
			"x": -748.7288227081299,
			"y": -277.47745513916016,
			"width": 250.77029418945312,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "ae",
			"roundness": null,
			"seed": 586062477,
			"version": 15,
			"versionNonce": 1595240419,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "TSXhHTVf"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "GVWmEk9xro-m9uPbjxKBn",
			"type": "rectangle",
			"x": -496.19482421875,
			"y": 57.492530822753906,
			"width": 172.40603637695312,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "af",
			"roundness": null,
			"seed": 1018544365,
			"version": 18,
			"versionNonce": 2135128963,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "yeT5pfx6"
				},
				{
					"id": "p0TKb2ucN-oItF7biLZoC",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "-R5vDK03JWnZnbfC0erDe",
			"type": "rectangle",
			"x": -696.9558410644531,
			"y": 57.492530822753906,
			"width": 150.76101684570312,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "ag",
			"roundness": null,
			"seed": 864623437,
			"version": 27,
			"versionNonce": 1894716195,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "YfeipMef"
				},
				{
					"id": "kukjkK_k3laMWYhBXqw7d",
					"type": "arrow"
				},
				{
					"id": "PI3nen3PcOo4dos0be0tP",
					"type": "arrow"
				},
				{
					"id": "eDmyCbqC4ht4Is3zorGPs",
					"type": "arrow"
				},
				{
					"id": "iekKZp05e4wU-Hd1GSrnv",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "e7h5BWLqQMmtoYvue29RZ",
			"type": "rectangle",
			"x": -1034.7048377990723,
			"y": 237.47752380371094,
			"width": 125.98512268066406,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"mw079WuoWV3HJLBrAaMgP",
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "ah",
			"roundness": null,
			"seed": 2143431085,
			"version": 20,
			"versionNonce": 1149679299,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "1AyHANYf"
				},
				{
					"id": "nDgtpcT0D1uyqyjQmRHdM",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "Rm9Se3rh1W2q8q9Ejjk4B",
			"type": "rectangle",
			"x": -1046.1050262451172,
			"y": 359.97002029418945,
			"width": 148.78550720214844,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"mw079WuoWV3HJLBrAaMgP",
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "ai",
			"roundness": null,
			"seed": 1384803341,
			"version": 21,
			"versionNonce": 2024334947,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "l5QOIoHq"
				},
				{
					"id": "nDgtpcT0D1uyqyjQmRHdM",
					"type": "arrow"
				},
				{
					"id": "idY1dAdx34YWvq2oAZ9OM",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "prvry6qI5vVUiKDKRNshc",
			"type": "rectangle",
			"x": -1030.6147499084473,
			"y": 514.9550132751465,
			"width": 117.80496215820312,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"mw079WuoWV3HJLBrAaMgP",
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aj",
			"roundness": null,
			"seed": 2077975149,
			"version": 23,
			"versionNonce": 874783235,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "TuaTy2EL"
				},
				{
					"id": "idY1dAdx34YWvq2oAZ9OM",
					"type": "arrow"
				},
				{
					"id": "nPjDzw9tpU_BMjFxXjiQa",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "YUq14b1frUrEuZ4J1tJDr",
			"type": "rectangle",
			"x": -1296.37380027771,
			"y": -277.47745513916016,
			"width": 203.0941925048828,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"H_M7mu7RTfI-Uam1h8jlD",
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "ak",
			"roundness": null,
			"seed": 276729037,
			"version": 20,
			"versionNonce": 1073146275,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "8CS6SXpg"
				},
				{
					"id": "yCADr08AYBI39LuzTbfW_",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "sLrpRUPevSoLLr_D5cfSN",
			"type": "rectangle",
			"x": -1221.0498123168945,
			"y": -97.49246215820312,
			"width": 141.41122436523438,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"H_M7mu7RTfI-Uam1h8jlD",
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "al",
			"roundness": null,
			"seed": 1343056685,
			"version": 21,
			"versionNonce": 1095744835,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "UTpKi1cx"
				},
				{
					"id": "RL2P4xV77TxTOcnHZRhFy",
					"type": "arrow"
				},
				{
					"id": "yCADr08AYBI39LuzTbfW_",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "0ea8U9GUaNdwo3cQH58EX",
			"type": "rectangle",
			"x": -1263.9761276245117,
			"y": 57.492530822753906,
			"width": 227.26385498046875,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"H_M7mu7RTfI-Uam1h8jlD",
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "am",
			"roundness": null,
			"seed": 1257340301,
			"version": 21,
			"versionNonce": 864885987,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "AYS2IBN9"
				},
				{
					"id": "RL2P4xV77TxTOcnHZRhFy",
					"type": "arrow"
				},
				{
					"id": "ncdAUnDbcow1ZgL9fcuHu",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "TKLJsXzW5Vjt4HSOHFC53",
			"type": "rectangle",
			"x": -882.0196151733398,
			"y": -97.49246215820312,
			"width": 231.58575439453125,
			"height": 47.492496490478516,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "an",
			"roundness": null,
			"seed": 1214530541,
			"version": 19,
			"versionNonce": 574457987,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "bDVHoljj"
				},
				{
					"id": "1FLh6jFTad8n_v7Q2KuWc",
					"type": "arrow"
				},
				{
					"id": "YzRqsPOhHHag4KVeavDTV",
					"type": "arrow"
				}
			],
			"updated": 1742269743163,
			"link": null,
			"locked": false
		},
		{
			"id": "tIqzzdMTvP-OxIiJCe0Xx",
			"type": "arrow",
			"x": -1746.1062482371367,
			"y": -693.9399375915527,
			"width": 84.16960956526168,
			"height": 926.1175035095214,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"b069iyLJOd9Dsf92UvXNF",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "ao",
			"roundness": {
				"type": 2
			},
			"seed": 1819229773,
			"version": 38,
			"versionNonce": 1056596877,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "o9UuYcOz"
				}
			],
			"updated": 1742269959208,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					84.16960956526168,
					40.246503509521446
				],
				[
					84.16960956526168,
					81.49250350952146
				],
				[
					84.16960956526168,
					130.23850350952142
				],
				[
					84.16960956526168,
					195.23150350952142
				],
				[
					84.16960956526168,
					260.22350350952144
				],
				[
					84.16960956526168,
					325.21650350952143
				],
				[
					84.16960956526168,
					366.4625035095214
				],
				[
					84.16960956526168,
					391.4625035095214
				],
				[
					84.16960956526168,
					440.20850350952145
				],
				[
					84.16960956526168,
					488.95450350952143
				],
				[
					84.16960956526168,
					530.2015035095214
				],
				[
					84.16960956526168,
					571.4475035095215
				],
				[
					84.16960956526168,
					620.1935035095215
				],
				[
					84.16960956526168,
					685.1865035095215
				],
				[
					84.16960956526168,
					726.4325035095214
				],
				[
					84.16960956526168,
					775.1785035095215
				],
				[
					84.16960956526168,
					823.9245035095215
				],
				[
					84.16960956526168,
					865.1715035095215
				],
				[
					84.16960956526168,
					926.1175035095214
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "RHwh8wll1V-3w4O5eG8TZ",
				"focus": -0.000009822694603342619,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "2qvm5Jun-e8fqcl4Oex7s",
				"focus": -0.000001429003928785963,
				"gap": 5.2999578857422875,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "1rV2FrN8Qd60I_hNOKdQ7",
			"type": "arrow",
			"x": -1923.4724292755127,
			"y": -701.5016494007542,
			"width": 349.4412093963624,
			"height": 108.75421531872291,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"b069iyLJOd9Dsf92UvXNF",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "ap",
			"roundness": {
				"type": 2
			},
			"seed": 502000813,
			"version": 40,
			"versionNonce": 1268159149,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "A5g90yv1"
				}
			],
			"updated": 1742269959209,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					-349.4412093963622,
					47.80821531872296
				],
				[
					-349.4412093963624,
					108.75421531872291
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "RHwh8wll1V-3w4O5eG8TZ",
				"focus": 0.000018892578888971692,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "oh2JBXHvVuewF5iUs_OBV",
				"focus": 0.0000033623757609682967,
				"gap": 5.299992980957029,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "ZuHwpiI2rEqXGZ90O0xtT",
			"type": "arrow",
			"x": -1885.6342272861027,
			"y": -693.9399375915527,
			"width": 142.7474113857724,
			"height": 101.19250350952143,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"b069iyLJOd9Dsf92UvXNF",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aq",
			"roundness": {
				"type": 2
			},
			"seed": 746835725,
			"version": 38,
			"versionNonce": 1508488461,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "eJlTdalo"
				}
			],
			"updated": 1742269959209,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					-142.7474113857724,
					40.246503509521446
				],
				[
					-142.74741138577224,
					101.19250350952143
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "RHwh8wll1V-3w4O5eG8TZ",
				"focus": 0.000011834985248358093,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "ILh3Hut3t2HObQo-XyQFH",
				"focus": -0.0000013181353676402093,
				"gap": 5.299992980957029,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "LqDWplcBsB7j3F35c_tHH",
			"type": "arrow",
			"x": -1795.2250568215788,
			"y": -693.9399375915527,
			"width": 4.2874181497038535,
			"height": 101.19250350952143,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"b069iyLJOd9Dsf92UvXNF",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "ar",
			"roundness": {
				"type": 2
			},
			"seed": 917529965,
			"version": 38,
			"versionNonce": 1248430957,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "0fgqHlh7"
				}
			],
			"updated": 1742269959209,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					4.2874181497038535,
					40.246503509521446
				],
				[
					4.2874181497038535,
					101.19250350952143
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "RHwh8wll1V-3w4O5eG8TZ",
				"focus": 0.0000013421384653938596,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "jzPCB6T4M3Oro9M2yzRmp",
				"focus": 0.000004530806955106319,
				"gap": 5.299992980957029,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "qxNNAKBx-GBM05cSZgrK9",
			"type": "arrow",
			"x": 2215.734608072403,
			"y": -408.9699516296387,
			"width": 76.3207532557226,
			"height": 918.6245175476074,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"hyAIBtDxURJh_BSk11hdC",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "as",
			"roundness": {
				"type": 2
			},
			"seed": 1337667533,
			"version": 35,
			"versionNonce": 1879528877,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "wPmgfDJi"
				}
			],
			"updated": 1742269959211,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					76.3207532557226,
					40.246517547607425
				],
				[
					76.3207532557226,
					81.4925175476074
				],
				[
					76.3207532557226,
					106.4925175476074
				],
				[
					76.3207532557226,
					155.23851754760744
				],
				[
					76.3207532557226,
					203.98451754760742
				],
				[
					76.3207532557226,
					245.23151754760738
				],
				[
					76.3207532557226,
					286.4775175476075
				],
				[
					76.3207532557226,
					335.22351754760746
				],
				[
					76.3207532557226,
					400.2165175476074
				],
				[
					76.3207532557226,
					441.4625175476074
				],
				[
					76.3207532557226,
					490.20851754760747
				],
				[
					76.3207532557226,
					538.9545175476075
				],
				[
					76.3207532557226,
					580.2015175476074
				],
				[
					76.3207532557226,
					621.4475175476074
				],
				[
					76.3207532557226,
					670.1935175476074
				],
				[
					76.3207532557226,
					718.9395175476075
				],
				[
					76.3207532557226,
					743.9395175476075
				],
				[
					76.3207532557226,
					792.6865175476073
				],
				[
					76.3207532557226,
					841.4325175476074
				],
				[
					76.3207532557226,
					882.6785175476075
				],
				[
					76.3207532557226,
					918.6245175476074
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "MgqlX2Yy00CDM5SDyF0Q0",
				"focus": -0.00001785735931425838,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "sfDRCF8wXoCpiLY0q6ZfO",
				"focus": -0.0000021114947378858494,
				"gap": 5.300447357177745,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "5U-r2iLIYnP-gCw2NspkM",
			"type": "arrow",
			"x": 2270.0863613281253,
			"y": -538.9549446105957,
			"width": 59.81600000000071,
			"height": 78.63051052856446,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"hyAIBtDxURJh_BSk11hdC",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "at",
			"roundness": {
				"type": 2
			},
			"seed": 1706929709,
			"version": 35,
			"versionNonce": 2115366125,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "GgVVouD4"
				}
			],
			"updated": 1742269959210,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					40.24651052856444
				],
				[
					-59.81600000000071,
					78.63051052856446
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "ht05Sv4Wu8q8RxH9efHP8",
				"focus": -0.000003969670439077373,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "MgqlX2Yy00CDM5SDyF0Q0",
				"focus": -1.421371614912565e-7,
				"gap": 2.8619859619140584,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "555JFpA1LVe-bAUd-WOrH",
			"type": "arrow",
			"x": 2008.3193613281246,
			"y": -538.9549446105957,
			"width": 96.93700000000081,
			"height": 79.50351052856445,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"hyAIBtDxURJh_BSk11hdC",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "au",
			"roundness": {
				"type": 2
			},
			"seed": 1738629261,
			"version": 35,
			"versionNonce": 1707445869,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "1a4Pzw48"
				}
			],
			"updated": 1742269959211,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					40.24651052856444
				],
				[
					96.93700000000081,
					79.50351052856445
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "0T6eB7YBOr50H7rttPChY",
				"focus": 0.0000015153259105710036,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "MgqlX2Yy00CDM5SDyF0Q0",
				"focus": -0.00000752183563382091,
				"gap": 1.988985961914068,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "pS0t-bX6iYs75i8NkzuJZ",
			"type": "arrow",
			"x": 47.87802243112873,
			"y": -693.9399375915527,
			"width": 107.59233889699618,
			"height": 101.19250350952143,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"qOFZUrLzmmUOzUyD87g3u",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "av",
			"roundness": {
				"type": 2
			},
			"seed": 723502829,
			"version": 35,
			"versionNonce": 1430591661,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "NfdsXdDW"
				}
			],
			"updated": 1742269959212,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					107.59233889699618,
					40.246503509521446
				],
				[
					107.59233889699618,
					101.19250350952143
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "O01GpUqj0dpcdpGeHI9Y_",
				"focus": -0.0000216261121432485,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "AcKmThWP1QtdVlTb6DjdA",
				"focus": -3.850139064751312e-9,
				"gap": 5.299992980957029,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "JEN4Z3KAgTvZ_KF_KxMn5",
			"type": "arrow",
			"x": 155.4703613281249,
			"y": -538.9549446105957,
			"width": 0,
			"height": 76.19251052856447,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"qOFZUrLzmmUOzUyD87g3u",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "aw",
			"roundness": {
				"type": 2
			},
			"seed": 314728781,
			"version": 35,
			"versionNonce": 2010610445,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "7zTwSZN5"
				}
			],
			"updated": 1742269959212,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					40.24651052856444
				],
				[
					0,
					76.19251052856447
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "AcKmThWP1QtdVlTb6DjdA",
				"focus": 3.850139064751312e-9,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "Ec02pJ26mWo9nPFgqDjAh",
				"focus": -3.2453437714552187e-9,
				"gap": 5.299985961914047,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "pWqEWKkgPIm81JJ438V4s",
			"type": "arrow",
			"x": 155.4703613281249,
			"y": -408.9699516296387,
			"width": 0,
			"height": 126.1925175476074,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"qOFZUrLzmmUOzUyD87g3u",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "ax",
			"roundness": {
				"type": 2
			},
			"seed": 1944235949,
			"version": 35,
			"versionNonce": 18930221,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "Qfj2N16A"
				}
			],
			"updated": 1742269959213,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					40.246517547607425
				],
				[
					0,
					81.4925175476074
				],
				[
					0,
					126.1925175476074
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "Ec02pJ26mWo9nPFgqDjAh",
				"focus": 3.245343771455219e-9,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "gnxdKremyYJcvEZhRAxwI",
				"focus": -4.201234013126076e-9,
				"gap": 5.299978942871121,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "8ObQjvx7LSndKi2tmnvl5",
			"type": "arrow",
			"x": 943.944287008955,
			"y": -48.99996566772461,
			"width": 6.192074319170047,
			"height": 101.19253158569336,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"SzDsw0RdvM1MXjcViO4vw",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "ay",
			"roundness": {
				"type": 2
			},
			"seed": 1017786893,
			"version": 34,
			"versionNonce": 1417421261,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269959215,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					6.192074319170047,
					40.24653158569333
				],
				[
					6.192074319170047,
					101.19253158569336
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "XK78bn_EZJAAPlFPCz68w",
				"focus": -0.000007087734267329801,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "qM994QmPe72J2xQJLfeoe",
				"focus": 8.517729687976124e-7,
				"gap": 5.299964904785156,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "zjeyYmJ_Olcaz1N6Xudc2",
			"type": "arrow",
			"x": 950.1363613281251,
			"y": 105.98502731323242,
			"width": 0,
			"height": 126.19253860473623,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"SzDsw0RdvM1MXjcViO4vw",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "az",
			"roundness": {
				"type": 2
			},
			"seed": 1511155821,
			"version": 34,
			"versionNonce": 997062893,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269959216,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					23.999538604736358
				],
				[
					0,
					65.24653860473632
				],
				[
					0,
					126.19253860473623
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "qM994QmPe72J2xQJLfeoe",
				"focus": -8.517729687976125e-7,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "jqFXmP318lDWl6YaQOvIn",
				"focus": 0.00000105382195154983,
				"gap": 5.2999578857422875,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "ZATzAEsADfBSjpELTeZ0O",
			"type": "arrow",
			"x": 950.1363613281251,
			"y": 285.97002029418945,
			"width": 0,
			"height": 68.69954562377939,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"SzDsw0RdvM1MXjcViO4vw",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b00",
			"roundness": {
				"type": 2
			},
			"seed": 1575277261,
			"version": 34,
			"versionNonce": 511333197,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269959216,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					23.99954562377934
				],
				[
					0,
					68.69954562377939
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "jqFXmP318lDWl6YaQOvIn",
				"focus": -0.00000105382195154983,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "F7J50ub-BOxa-Jp12HqTK",
				"focus": 0.0000014068764140294232,
				"gap": 5.300454376220614,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "uYX9SdPKsycPC0sOw1eRW",
			"type": "arrow",
			"x": 552.8841587133386,
			"y": 105.98502731323242,
			"width": 4.025202614786622,
			"height": 126.19253860473623,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"zk0wQlgc45-JaPCRpRnFu",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b01",
			"roundness": {
				"type": 2
			},
			"seed": 1689973037,
			"version": 34,
			"versionNonce": 548903533,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269959216,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					4.025202614786622,
					23.999538604736358
				],
				[
					4.025202614786622,
					65.24653860473632
				],
				[
					4.025202614786622,
					126.19253860473623
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "4JCqqjSydFFi1fons0WWW",
				"focus": -0.000005343457090927544,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "e2orvQeBvm4UYCdZZuApB",
				"focus": -0.0000014021431418819917,
				"gap": 5.2999578857422875,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "LtrE2cybvgslFolNvXv7H",
			"type": "arrow",
			"x": 556.9093613281252,
			"y": 285.97002029418945,
			"width": 0,
			"height": 68.69954562377939,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"zk0wQlgc45-JaPCRpRnFu",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b02",
			"roundness": {
				"type": 2
			},
			"seed": 1006519181,
			"version": 34,
			"versionNonce": 1024705741,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269959216,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					23.99954562377934
				],
				[
					0,
					68.69954562377939
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "e2orvQeBvm4UYCdZZuApB",
				"focus": 0.0000014021431418819917,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "aX29HCHmoz9fC3hXd11Gh",
				"focus": -0.0000010189717324313495,
				"gap": 5.300454376220614,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "6O6xXzvLMnpXv-weLCKjr",
			"type": "arrow",
			"x": 556.9093613281252,
			"y": 408.46251678466797,
			"width": 0,
			"height": 101.19204913330077,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"zk0wQlgc45-JaPCRpRnFu",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b03",
			"roundness": {
				"type": 2
			},
			"seed": 1206405613,
			"version": 34,
			"versionNonce": 1301853581,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269959217,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					24.000049133300763
				],
				[
					0,
					65.24604913330086
				],
				[
					0,
					101.19204913330077
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "aX29HCHmoz9fC3hXd11Gh",
				"focus": 0.0000010189717324313497,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "9BMk73-8-UHV4lmnYE9dt",
				"focus": -0.0000016126694828612568,
				"gap": 5.300447357177745,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "sHE-S98XgCwml0SskWQw7",
			"type": "arrow",
			"x": 1657.633361328125,
			"y": 285.97002029418945,
			"width": 43.346000000000004,
			"height": 71.5535456237792,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"g7-OaCcoEofh5wslqelOr",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b04",
			"roundness": {
				"type": 2
			},
			"seed": 696419405,
			"version": 34,
			"versionNonce": 299146605,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269959218,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					23.99954562377934
				],
				[
					0,
					48.99954562377934
				],
				[
					-43.346000000000004,
					71.5535456237792
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "lVmfzqjMLYeNX1irRQdtg",
				"focus": 0.000002672611495285156,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "3NE-4xvz3SJO0togIL87C",
				"focus": 1.1146571281258936e-8,
				"gap": 2.4464543762207995,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "sZIULodKyBnaT3_kaeFnF",
			"type": "arrow",
			"x": 1411.058361328125,
			"y": 285.97002029418945,
			"width": 73.36099999999988,
			"height": 72.38954562377921,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"g7-OaCcoEofh5wslqelOr",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b05",
			"roundness": {
				"type": 2
			},
			"seed": 614888109,
			"version": 34,
			"versionNonce": 697853901,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269959218,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					23.99954562377934
				],
				[
					0,
					48.99954562377934
				],
				[
					73.36099999999988,
					72.38954562377921
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "QtUwW_vY4_8RmierPK5q2",
				"focus": -0.000004628881323105298,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "3NE-4xvz3SJO0togIL87C",
				"focus": 0.0000032680670567878648,
				"gap": 1.6104543762207868,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "PCqgfHJXHFiEJ_f_HXIbv",
			"type": "arrow",
			"x": 646.151361328125,
			"y": -538.9549446105957,
			"width": 0,
			"height": 76.19251052856447,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b06",
			"roundness": {
				"type": 2
			},
			"seed": 1174246669,
			"version": 30,
			"versionNonce": 1852116301,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269959213,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					40.24651052856444
				],
				[
					0,
					76.19251052856447
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "PutVtMjXFW4CxbATlLTt-",
				"focus": -0.0000032280827042850554,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "-K6jX1nqRu8UJHIunl10l",
				"focus": 0.000002873184446322689,
				"gap": 5.299985961914047,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "jx_ElHDTaL_J-WMq6HQzl",
			"type": "arrow",
			"x": 758.6291751861572,
			"y": -414.72663908754134,
			"width": 272.4881861419676,
			"height": 134.7462050055101,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b07",
			"roundness": {
				"type": 2
			},
			"seed": 1224829805,
			"version": 30,
			"versionNonce": 1228021037,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269959214,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					272.4881861419676,
					46.0032050055101
				],
				[
					272.4881861419676,
					87.24920500551008
				],
				[
					272.4881861419676,
					112.24920500551008
				],
				[
					230.49918614196758,
					134.7462050055101
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "-K6jX1nqRu8UJHIunl10l",
				"focus": 0.000006579092551478617,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "X_hrR9Uye6ILBoShzyOfk",
				"focus": -0.0000012656014703244795,
				"gap": 2.5029789428710956,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "37ROiDyu3zF3WhhVK4Omr",
			"type": "arrow",
			"x": 1027.9454975128174,
			"y": -236.13097838430835,
			"width": 470.78595705105295,
			"height": 113.63854430227715,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b08",
			"roundness": {
				"type": 2
			},
			"seed": 1039889869,
			"version": 31,
			"versionNonce": 1622142861,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269959214,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					155.39486381530742,
					31.145544302277102
				],
				[
					155.39486381530742,
					72.39254430227706
				],
				[
					155.39486381530742,
					113.63854430227715
				],
				[
					-315.39109323574553,
					113.63854430227715
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "X_hrR9Uye6ILBoShzyOfk",
				"focus": 0.000018602967083700446,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "i2wIJt5dXvPxeXkhJ3oaz",
				"focus": -0.9999998988164047,
				"gap": 1,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "oSZtyzwGfm--O9uAOOYc8",
			"type": "arrow",
			"x": 711.5543766021729,
			"y": 33.760589287264324,
			"width": 14.024015274047997,
			"height": 5.17129391485819,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b09",
			"roundness": {
				"type": 2
			},
			"seed": 1879389229,
			"version": 31,
			"versionNonce": 958139565,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269959205,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					-14.024015274047997,
					5.17129391485819
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "i2wIJt5dXvPxeXkhJ3oaz",
				"focus": 0.5879714527943366,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "EX9tduE9P4El2CFh-GPBs",
				"focus": -0.6055623517296119,
				"gap": 4.975984725952003,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "9yRHANyal3iTqiJcYPhXz",
			"type": "arrow",
			"x": 693.5543766021729,
			"y": 224.24190635479357,
			"width": 580.723984725952,
			"height": 1.3593384967711586,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0A",
			"roundness": {
				"type": 2
			},
			"seed": 185083533,
			"version": 31,
			"versionNonce": 474843949,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269959202,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					580.723984725952,
					1.3593384967711586
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "EX9tduE9P4El2CFh-GPBs",
				"focus": -0.30996632490967724,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "TaeRTxNLHvJEpplT6a_6R",
				"focus": 0.8706305125173297,
				"gap": 5.299603454589942,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "nDgtpcT0D1uyqyjQmRHdM",
			"type": "arrow",
			"x": -971.7126386718751,
			"y": 285.97002029418945,
			"width": 0,
			"height": 68.69954562377939,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"mw079WuoWV3HJLBrAaMgP",
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0B",
			"roundness": {
				"type": 2
			},
			"seed": 29215981,
			"version": 37,
			"versionNonce": 487197389,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269959219,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					23.99954562377934
				],
				[
					0,
					68.69954562377939
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "e7h5BWLqQMmtoYvue29RZ",
				"focus": 0.000005750093775237324,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "Rm9Se3rh1W2q8q9Ejjk4B",
				"focus": -0.000004920208143896936,
				"gap": 5.300454376220614,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "idY1dAdx34YWvq2oAZ9OM",
			"type": "arrow",
			"x": -971.7126386718751,
			"y": 408.46251678466797,
			"width": 0,
			"height": 101.19204913330077,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"mw079WuoWV3HJLBrAaMgP",
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0C",
			"roundness": {
				"type": 2
			},
			"seed": 867149645,
			"version": 34,
			"versionNonce": 1832221581,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269959219,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					24.000049133300763
				],
				[
					0,
					65.24604913330086
				],
				[
					0,
					101.19204913330077
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "Rm9Se3rh1W2q8q9Ejjk4B",
				"focus": 0.000004920208143896935,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "prvry6qI5vVUiKDKRNshc",
				"focus": -0.000006278895601763839,
				"gap": 5.300447357177745,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "yCADr08AYBI39LuzTbfW_",
			"type": "arrow",
			"x": -1172.2446848294348,
			"y": -228.98495864868164,
			"width": 21.900046157559927,
			"height": 126.19252456665038,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"H_M7mu7RTfI-Uam1h8jlD",
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0D",
			"roundness": {
				"type": 2
			},
			"seed": 1396127149,
			"version": 34,
			"versionNonce": 1708707085,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269959220,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					21.900046157559927,
					23.999524566650393
				],
				[
					21.900046157559927,
					65.24652456665035
				],
				[
					21.900046157559927,
					126.19252456665038
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "YUq14b1frUrEuZ4J1tJDr",
				"focus": -0.000004648316633941915,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "sLrpRUPevSoLLr_D5cfSN",
				"focus": -0.0000062023025335209385,
				"gap": 5.299971923828139,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "RL2P4xV77TxTOcnHZRhFy",
			"type": "arrow",
			"x": -1150.344638671875,
			"y": -48.99996566772461,
			"width": 0,
			"height": 101.19253158569336,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"H_M7mu7RTfI-Uam1h8jlD",
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0E",
			"roundness": {
				"type": 2
			},
			"seed": 192804877,
			"version": 34,
			"versionNonce": 951427949,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269959220,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					40.24653158569333
				],
				[
					0,
					101.19253158569336
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "sLrpRUPevSoLLr_D5cfSN",
				"focus": 0.000006202302533520938,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "0ea8U9GUaNdwo3cQH58EX",
				"focus": -0.000003859281517618222,
				"gap": 5.299964904785156,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "kukjkK_k3laMWYhBXqw7d",
			"type": "arrow",
			"x": -697.9558410644531,
			"y": 93.02592214409312,
			"width": 239.48579760742177,
			"height": 105.45160165961782,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0F",
			"roundness": {
				"type": 2
			},
			"seed": 1719496301,
			"version": 37,
			"versionNonce": 375914221,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269959218,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					-239.48579760742177,
					36.958643773875664
				],
				[
					-239.48579760742177,
					105.45160165961782
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "-R5vDK03JWnZnbfC0erDe",
				"focus": 0.000007865236689364568,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "rc_2zfag79_m4gVSsVFft",
				"focus": 0.3132805677203098,
				"gap": 14,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "PI3nen3PcOo4dos0be0tP",
			"type": "arrow",
			"x": -1000.7123260498047,
			"y": 68.5605059364695,
			"width": 298.4566873779297,
			"height": 3.676345516360385,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0G",
			"roundness": {
				"type": 2
			},
			"seed": 1929320653,
			"version": 31,
			"versionNonce": 1480825165,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269959218,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					298.4566873779297,
					3.676345516360385
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "_RbMwjcoSPopxOXLE0M4S",
				"focus": 0.6964428012233052,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "-R5vDK03JWnZnbfC0erDe",
				"focus": 0.32454681890829423,
				"gap": 5.299797607421851,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "kj2u5EmSLawPu0DnbbPGA",
			"type": "arrow",
			"x": -1449.502136230469,
			"y": -568.2364440122121,
			"width": 1991.131497558594,
			"height": 2.3330001982939166,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b0H",
			"roundness": {
				"type": 2
			},
			"seed": 714897197,
			"version": 31,
			"versionNonce": 279442157,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "u7hpUtn7"
				}
			],
			"updated": 1742269959213,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					1991.131497558594,
					2.3330001982939166
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "i0LLNFRk6PdTV01ue_zkK",
				"focus": -0.6306160449172346,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "PutVtMjXFW4CxbATlLTt-",
				"focus": 0.08715695335921697,
				"gap": 5.299549880981431,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "NkEQcmmOXFiqCO_w02ePC",
			"type": "arrow",
			"x": 309.0140018463135,
			"y": -604.2365617703135,
			"width": 15.244359481811443,
			"height": 15.180810128303278,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0I",
			"roundness": {
				"type": 2
			},
			"seed": 398395789,
			"version": 32,
			"versionNonce": 1474154029,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "L7pZEcIZ"
				}
			],
			"updated": 1742269959206,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					15.244359481811443,
					15.180810128303278
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "xn3CuZNjrq493cpDUThZH",
				"focus": -0.7071544500659132,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "0pPVe1x2WqqSdxvLxeap8",
				"focus": -0.11388090837008744,
				"gap": 3.7557320709229316,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "iktjHotKfcXMxguPVp4ET",
			"type": "arrow",
			"x": -240.57266807556152,
			"y": -299.2812005743806,
			"width": 15.138970596313357,
			"height": 14.237220730154263,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0J",
			"roundness": {
				"type": 2
			},
			"seed": 1000361965,
			"version": 40,
			"versionNonce": 1623031949,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "7MXPjehI"
				}
			],
			"updated": 1742269959206,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					-15.138970596313357,
					14.237220730154263
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "xn3CuZNjrq493cpDUThZH",
				"focus": 0.1327208042327132,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "nYNmKjIbl5ScmFOA9qcUg",
				"focus": 0.1240632708095756,
				"gap": 3.8609168701173076,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "fwlmycFCjo666ejf9fxaV",
			"type": "arrow",
			"x": 1831.729393005371,
			"y": -262.73995499433687,
			"width": 799.4840316772461,
			"height": 4.697358187187206,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b0K",
			"roundness": {
				"type": 2
			},
			"seed": 877251149,
			"version": 31,
			"versionNonce": 1099199981,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "MfV2XdAz"
				}
			],
			"updated": 1742269959214,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					-799.4840316772461,
					4.697358187187206
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "KR3Gd4hKNX-6c6ls9LF13",
				"focus": 0.49438027495095105,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "X_hrR9Uye6ILBoShzyOfk",
				"focus": -0.15543198866436828,
				"gap": 5.299863815307617,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "eDmyCbqC4ht4Is3zorGPs",
			"type": "arrow",
			"x": 1831.729393005371,
			"y": 74.72754054355103,
			"width": 2372.6240316772464,
			"height": 5.16101848974759,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b0L",
			"roundness": {
				"type": 2
			},
			"seed": 580188333,
			"version": 31,
			"versionNonce": 1685907373,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "FbKiSIF2"
				}
			],
			"updated": 1742269959219,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					-2372.6240316772464,
					5.16101848974759
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "KR3Gd4hKNX-6c6ls9LF13",
				"focus": 0.00491433793986351,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "-R5vDK03JWnZnbfC0erDe",
				"focus": -0.049130476669037464,
				"gap": 5.300185546874673,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "_HXvwDZoBII3iJW1Cy8Uu",
			"type": "arrow",
			"x": 885.0148623288648,
			"y": -228.98495864868164,
			"width": 58.29250100073989,
			"height": 104.3215245666504,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0M",
			"roundness": {
				"type": 2
			},
			"seed": 1345018637,
			"version": 36,
			"versionNonce": 1991848013,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "QwIrfB89"
				}
			],
			"updated": 1742269959215,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					-53.45750100073985,
					23.999524566650393
				],
				[
					-53.45750100073985,
					65.24652456665035
				],
				[
					-58.29250100073989,
					104.3215245666504
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "X_hrR9Uye6ILBoShzyOfk",
				"focus": 0.000004473810537702027,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "i2wIJt5dXvPxeXkhJ3oaz",
				"focus": -0.6300116456804972,
				"gap": 2.1709719238281195,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "4OUCC0iiWe5HpCoDnZ8Ed",
			"type": "arrow",
			"x": 711.5543766021729,
			"y": 34.890162744915244,
			"width": 14.209015274047943,
			"height": 6.749364497974732,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0N",
			"roundness": {
				"type": 2
			},
			"seed": 361132397,
			"version": 36,
			"versionNonce": 190795725,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "f1zJNC2m"
				}
			],
			"updated": 1742269959206,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					-14.209015274047943,
					6.749364497974732
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "i2wIJt5dXvPxeXkhJ3oaz",
				"focus": 0.6148534273937608,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "EX9tduE9P4El2CFh-GPBs",
				"focus": -0.5145879461682271,
				"gap": 4.7909847259520575,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "4_Wludr31gnxxpd0K4S3A",
			"type": "arrow",
			"x": 347.01409339904785,
			"y": 213.93969974451196,
			"width": 1204.0337320709227,
			"height": 0.1262051749442037,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b0O",
			"roundness": {
				"type": 2
			},
			"seed": 2146417613,
			"version": 39,
			"versionNonce": 1528587245,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "C2ZwPFbO"
				}
			],
			"updated": 1742269959202,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					-1204.0337320709227,
					0.1262051749442037
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "EX9tduE9P4El2CFh-GPBs",
				"focus": 0.34612611348697775,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "rc_2zfag79_m4gVSsVFft",
				"focus": -0.9914053145267205,
				"gap": 5.2998651123045875,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "p0TKb2ucN-oItF7biLZoC",
			"type": "arrow",
			"x": -487.38344162096666,
			"y": 105.98502731323242,
			"width": 1836.7169999999996,
			"height": 112.57853860473631,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b0P",
			"roundness": {
				"type": 2
			},
			"seed": 931183149,
			"version": 35,
			"versionNonce": 1703975053,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "1wbrNwMk"
				}
			],
			"updated": 1742269959218,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					-75.0551970509083,
					23.999538604736358
				],
				[
					-75.0551970509083,
					65.24653860473632
				],
				[
					-75.0551970509083,
					106.4925386047363
				],
				[
					1761.6618029490915,
					112.57853860473631
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "GVWmEk9xro-m9uPbjxKBn",
				"focus": 0.000007532298560692991,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "TaeRTxNLHvJEpplT6a_6R",
				"focus": 0.9295944281210293,
				"gap": 5.299603454589942,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "iekKZp05e4wU-Hd1GSrnv",
			"type": "arrow",
			"x": -545.19482421875,
			"y": 102.8869341294295,
			"width": 2097.434185546875,
			"height": 155.89863178853932,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b0Q",
			"roundness": {
				"type": 2
			},
			"seed": 623045773,
			"version": 35,
			"versionNonce": 222128653,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "yH88vT17"
				}
			],
			"updated": 1742269959219,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					95.6091855468751,
					27.097631788539275
				],
				[
					95.6091855468751,
					68.34463178853923
				],
				[
					95.6091855468751,
					109.59063178853921
				],
				[
					2097.434185546875,
					155.89863178853932
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "-R5vDK03JWnZnbfC0erDe",
				"focus": 0.000007322282836168301,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "lVmfzqjMLYeNX1irRQdtg",
				"focus": 0.000005065028957772377,
				"gap": 5.298503356933452,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "5bj4bt_UyYAbhtn4gKxQ0",
			"type": "arrow",
			"x": -1298.975638671875,
			"y": 130.9850082397461,
			"width": 202.32299999999987,
			"height": 108.66455767822274,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b0R",
			"roundness": {
				"type": 2
			},
			"seed": 1485820653,
			"version": 32,
			"versionNonce": 1449159149,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "baNXB1Rh"
				}
			],
			"updated": 1742269959208,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					40.24655767822264
				],
				[
					0,
					81.49255767822262
				],
				[
					-202.32299999999987,
					108.66455767822274
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "_RbMwjcoSPopxOXLE0M4S",
				"focus": 0.4543577961816838,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "2qvm5Jun-e8fqcl4Oex7s",
				"focus": -0.000012009531980283778,
				"gap": 5.252691894531267,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "PZ3wYrFtRseHuwe8ppnxb",
			"type": "arrow",
			"x": 612.1716050749745,
			"y": -408.9699516296387,
			"width": 55.26224374684932,
			"height": 440.4624824523926,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0S",
			"roundness": {
				"type": 2
			},
			"seed": 777055565,
			"version": 36,
			"versionNonce": 2022825485,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "3PD0wdjl"
				}
			],
			"updated": 1742269959214,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					-55.26224374684932,
					40.246517547607425
				],
				[
					-55.26224374684932,
					81.4925175476074
				],
				[
					-55.26224374684932,
					106.4925175476074
				],
				[
					-55.26224374684932,
					155.23851754760744
				],
				[
					-55.26224374684932,
					203.98451754760742
				],
				[
					-55.26224374684932,
					245.23151754760738
				],
				[
					-55.26224374684932,
					286.4775175476075
				],
				[
					-55.26224374684932,
					335.22351754760746
				],
				[
					-55.26224374684932,
					400.2165175476074
				],
				[
					-54.18208365497139,
					440.4624824523926
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "-K6jX1nqRu8UJHIunl10l",
				"focus": 0.000003580539224724291,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "EX9tduE9P4El2CFh-GPBs",
				"focus": 0.2513910502397205,
				"gap": 1,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "OBKMBnGMOruKoV4rXPJIP",
			"type": "arrow",
			"x": 568.5938516994032,
			"y": -408.9699516296387,
			"width": 1565.0064903712782,
			"height": 109.20851754760741,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b0T",
			"roundness": {
				"type": 2
			},
			"seed": 901757869,
			"version": 32,
			"versionNonce": 337941613,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "OlyOeNVy"
				}
			],
			"updated": 1742269959214,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					-126.13249037127832,
					40.246517547607425
				],
				[
					-126.13249037127832,
					81.4925175476074
				],
				[
					-126.13249037127832,
					106.4925175476074
				],
				[
					-1565.0064903712782,
					109.20851754760741
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "-K6jX1nqRu8UJHIunl10l",
				"focus": 0.000013481130579925294,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "_RbMwjcoSPopxOXLE0M4S",
				"focus": -0.9838532973056641,
				"gap": 5.299687377929786,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "d_ZwPkuCNg_NCBlX2J5wZ",
			"type": "arrow",
			"x": 679.4995761352949,
			"y": -408.9699516296387,
			"width": 168.6697851928301,
			"height": 133.51851754760742,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0U",
			"roundness": {
				"type": 2
			},
			"seed": 1459994125,
			"version": 35,
			"versionNonce": 1848090285,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "MO9rPr1D"
				}
			],
			"updated": 1742269959215,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					54.234785192830145,
					40.246517547607425
				],
				[
					54.234785192830145,
					81.4925175476074
				],
				[
					54.234785192830145,
					106.4925175476074
				],
				[
					168.6697851928301,
					133.51851754760742
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "-K6jX1nqRu8UJHIunl10l",
				"focus": -0.000009515205493241272,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "X_hrR9Uye6ILBoShzyOfk",
				"focus": 0.000011160319648091267,
				"gap": 5.157682205200217,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "94oC8ZUWBBYfTqWfH4zfd",
			"type": "arrow",
			"x": -18.27963867187509,
			"y": -693.9399375915527,
			"width": 963.433,
			"height": 892.4174613952637,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b0V",
			"roundness": {
				"type": 2
			},
			"seed": 958166125,
			"version": 38,
			"versionNonce": 242952589,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "IFQRLfsN"
				}
			],
			"updated": 1742269959212,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					40.246503509521446
				],
				[
					0,
					81.49250350952146
				],
				[
					0,
					130.23850350952142
				],
				[
					0,
					195.23150350952142
				],
				[
					0,
					260.22350350952144
				],
				[
					0,
					325.21650350952143
				],
				[
					0,
					366.4625035095214
				],
				[
					0,
					391.4625035095214
				],
				[
					0,
					440.20850350952145
				],
				[
					0,
					488.95450350952143
				],
				[
					-963.433,
					530.2015035095214
				],
				[
					-963.433,
					571.4475035095215
				],
				[
					-963.433,
					620.1935035095215
				],
				[
					-963.433,
					685.1865035095215
				],
				[
					-963.433,
					726.4325035095214
				],
				[
					-963.433,
					775.1785035095215
				],
				[
					-963.433,
					823.9245035095215
				],
				[
					-963.433,
					892.4174613952637
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "O01GpUqj0dpcdpGeHI9Y_",
				"focus": -0.0000022574188444435953,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "rc_2zfag79_m4gVSsVFft",
				"focus": -0.09141714264034208,
				"gap": 14,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "c_WP35ptJL5kUzAhZt_3s",
			"type": "arrow",
			"x": -76.66713315561748,
			"y": -693.9399375915527,
			"width": 919.7455055162575,
			"height": 395.7965035095215,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b0W",
			"roundness": {
				"type": 2
			},
			"seed": 1741512397,
			"version": 32,
			"versionNonce": 1171812333,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "9DYXpUto"
				}
			],
			"updated": 1742269959212,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					-94.95450551625771,
					40.246503509521446
				],
				[
					-94.95450551625771,
					81.49250350952146
				],
				[
					-94.95450551625771,
					130.23850350952142
				],
				[
					-94.95450551625771,
					195.23150350952142
				],
				[
					-94.95450551625771,
					260.22350350952144
				],
				[
					-94.95450551625771,
					325.21650350952143
				],
				[
					-94.95450551625771,
					366.4625035095214
				],
				[
					-94.95450551625771,
					391.4625035095214
				],
				[
					-919.7455055162575,
					395.7965035095215
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "O01GpUqj0dpcdpGeHI9Y_",
				"focus": 0.000023872791990867786,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "_RbMwjcoSPopxOXLE0M4S",
				"focus": -0.9700424995850953,
				"gap": 5.299687377929786,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "1FLh6jFTad8n_v7Q2KuWc",
			"type": "arrow",
			"x": 155.4703613281249,
			"y": -228.98495864868164,
			"width": 921.6969999999999,
			"height": 126.19252456665038,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b0X",
			"roundness": {
				"type": 2
			},
			"seed": 967965997,
			"version": 31,
			"versionNonce": 973827117,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "Gb2obMvb"
				}
			],
			"updated": 1742269959221,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					23.999524566650393
				],
				[
					-921.6969999999999,
					65.24652456665035
				],
				[
					-921.6969999999999,
					126.19252456665038
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "gnxdKremyYJcvEZhRAxwI",
				"focus": 4.201234013126076e-9,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "TKLJsXzW5Vjt4HSOHFC53",
				"focus": 8.576019669118638e-7,
				"gap": 5.299971923828139,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "vJyx8Jye5-uxK7204eyoA",
			"type": "arrow",
			"x": 1563.948361328125,
			"y": 408.46251678466797,
			"width": 640.8790000000004,
			"height": 122.45304913330074,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b0Y",
			"roundness": {
				"type": 2
			},
			"seed": 1983106957,
			"version": 32,
			"versionNonce": 2134107693,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "uN1Hiqn1"
				}
			],
			"updated": 1742269959218,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					24.000049133300763
				],
				[
					0,
					65.24604913330086
				],
				[
					640.8790000000004,
					122.45304913330074
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "3NE-4xvz3SJO0togIL87C",
				"focus": -0.0000014491180463001163,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "sfDRCF8wXoCpiLY0q6ZfO",
				"focus": -0.00001875178417689661,
				"gap": 5.279274719237947,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "0VWYbEbtlwYDAk6_svx8L",
			"type": "arrow",
			"x": 2209.1066360473633,
			"y": 533.989775067566,
			"width": 1187.9872747192385,
			"height": 582.4072091495973,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b0Z",
			"roundness": {
				"type": 2
			},
			"seed": 999052781,
			"version": 32,
			"versionNonce": 1831311213,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "ER9EUJ24"
				}
			],
			"updated": 1742269959215,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					-1061.168274719238,
					-60.2812091495972
				],
				[
					-1061.168274719238,
					-101.5272091495973
				],
				[
					-1061.168274719238,
					-150.2732091495974
				],
				[
					-1061.168274719238,
					-199.02020914959724
				],
				[
					-1061.168274719238,
					-224.02020914959724
				],
				[
					-1061.168274719238,
					-272.76620914959733
				],
				[
					-1061.168274719238,
					-321.5122091495973
				],
				[
					-1061.168274719238,
					-362.7582091495973
				],
				[
					-1061.168274719238,
					-404.00520914959725
				],
				[
					-1061.168274719238,
					-452.75120914959723
				],
				[
					-1061.168274719238,
					-501.4972091495973
				],
				[
					-1061.168274719238,
					-542.7432091495973
				],
				[
					-1187.9872747192385,
					-582.4072091495973
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "sfDRCF8wXoCpiLY0q6ZfO",
				"focus": -0.000019242261061117317,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "XK78bn_EZJAAPlFPCz68w",
				"focus": 0.000008318993605462732,
				"gap": 1.5825315856933457,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "YzRqsPOhHHag4KVeavDTV",
			"type": "arrow",
			"x": -766.226638671875,
			"y": -48.99996566772461,
			"width": 1256.6150000000002,
			"height": 584.4335315856933,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b0a",
			"roundness": {
				"type": 2
			},
			"seed": 616894541,
			"version": 32,
			"versionNonce": 663182989,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "8mQZ1P41"
				}
			],
			"updated": 1742269959221,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					40.24653158569333
				],
				[
					0,
					81.49253158569331
				],
				[
					0,
					130.2385315856934
				],
				[
					0,
					178.9845315856934
				],
				[
					0,
					220.23153158569335
				],
				[
					0,
					261.4775315856933
				],
				[
					0,
					310.2235315856933
				],
				[
					0,
					358.9695315856934
				],
				[
					0,
					383.9695315856934
				],
				[
					0,
					432.71653158569325
				],
				[
					0,
					481.46253158569334
				],
				[
					0,
					522.7085315856934
				],
				[
					1256.6150000000002,
					584.4335315856933
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "TKLJsXzW5Vjt4HSOHFC53",
				"focus": -8.576019669118636e-7,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "9BMk73-8-UHV4lmnYE9dt",
				"focus": 0.000006558455288657678,
				"gap": 5.293658859252901,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "ncdAUnDbcow1ZgL9fcuHu",
			"type": "arrow",
			"x": -1150.344638671875,
			"y": 105.98502731323242,
			"width": 350.93100000000004,
			"height": 139.93053860473626,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b0b",
			"roundness": {
				"type": 2
			},
			"seed": 800554669,
			"version": 32,
			"versionNonce": 443067853,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "IHzrEHZv"
				}
			],
			"updated": 1742269959220,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					23.999538604736358
				],
				[
					0,
					65.24653860473632
				],
				[
					0,
					106.4925386047363
				],
				[
					-350.93100000000004,
					139.93053860473626
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "0ea8U9GUaNdwo3cQH58EX",
				"focus": 0.000003859281517618222,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "2qvm5Jun-e8fqcl4Oex7s",
				"focus": 0.0000037702156279965063,
				"gap": 5.275691894531292,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "nPjDzw9tpU_BMjFxXjiQa",
			"type": "arrow",
			"x": -971.7126386718751,
			"y": 563.447509765625,
			"width": 2941.838,
			"height": 126.19205615234364,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b0c",
			"roundness": {
				"type": 2
			},
			"seed": 1661804813,
			"version": 32,
			"versionNonce": 1031307757,
			"isDeleted": false,
			"boundElements": [
				{
					"type": "text",
					"id": "jiMqSZeO"
				}
			],
			"updated": 1742269959220,
			"link": null,
			"locked": false,
			"points": [
				[
					0,
					0
				],
				[
					0,
					24.00005615234386
				],
				[
					0,
					49.00005615234386
				],
				[
					2941.838,
					90.24605615234373
				],
				[
					2941.838,
					126.19205615234364
				]
			],
			"lastCommittedPoint": null,
			"startBinding": {
				"elementId": "prvry6qI5vVUiKDKRNshc",
				"focus": 0.00000627889560176384,
				"gap": 1,
				"fixedPoint": null
			},
			"endBinding": {
				"elementId": "i8FxVBqeKW52TEoN5icPm",
				"focus": 0.0000018150361900263251,
				"gap": 5.300440338134877,
				"fixedPoint": null
			},
			"startArrowhead": null,
			"endArrowhead": "arrow",
			"elbowed": false
		},
		{
			"id": "9ZmmV09k",
			"type": "text",
			"x": -76.74791187047958,
			"y": -787.4324340820312,
			"width": 153.49582374095917,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0d",
			"roundness": null,
			"seed": 876574573,
			"version": 33,
			"versionNonce": 548481955,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751607,
			"link": null,
			"locked": false,
			"text": "Overall Architecture",
			"rawText": "Overall Architecture",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "top",
			"containerId": "vERE8nM_-dpYsvchdp9Ec",
			"originalText": "Overall Architecture",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "nLtdnWr3",
			"type": "text",
			"x": -942.0712303519249,
			"y": -322.47745513916016,
			"width": 194.06778419017792,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0e",
			"roundness": null,
			"seed": 764936653,
			"version": 67,
			"versionNonce": 1433517891,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751607,
			"link": null,
			"locked": false,
			"text": "Components Code Block",
			"rawText": "Components Code Block",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "top",
			"containerId": "nYNmKjIbl5ScmFOA9qcUg",
			"originalText": "Components Code Block",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "4NG7tybl",
			"type": "text",
			"x": -1256.0311697125435,
			"y": -297.47745513916016,
			"width": 99.8478924036026,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"H_M7mu7RTfI-Uam1h8jlD",
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0f",
			"roundness": null,
			"seed": 1412448301,
			"version": 37,
			"versionNonce": 941547235,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751607,
			"link": null,
			"locked": false,
			"text": "Editing Tools",
			"rawText": "Editing Tools",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "top",
			"containerId": "_RbMwjcoSPopxOXLE0M4S",
			"originalText": "Editing Tools",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "dXThINhV",
			"type": "text",
			"x": -1024.5762176513672,
			"y": 217.47752380371094,
			"width": 105.7279052734375,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"mw079WuoWV3HJLBrAaMgP",
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0g",
			"roundness": null,
			"seed": 1307685517,
			"version": 41,
			"versionNonce": 1934035587,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751607,
			"link": null,
			"locked": false,
			"text": "Table System",
			"rawText": "Table System",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "top",
			"containerId": "rc_2zfag79_m4gVSsVFft",
			"originalText": "Table System",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "vYswF3q8",
			"type": "text",
			"x": 958.0218747109175,
			"y": -607.4474411010742,
			"width": 224.69976940751076,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0h",
			"roundness": null,
			"seed": 1201002733,
			"version": 35,
			"versionNonce": 1537786403,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "ViewComponent Code Block",
			"rawText": "ViewComponent Code Block",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "top",
			"containerId": "0pPVe1x2WqqSdxvLxeap8",
			"originalText": "ViewComponent Code Block",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "8E8tTmzv",
			"type": "text",
			"x": 1476.1358377337456,
			"y": 217.47752380371094,
			"width": 120.03586542606354,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"g7-OaCcoEofh5wslqelOr",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0i",
			"roundness": null,
			"seed": 447099725,
			"version": 37,
			"versionNonce": 707954115,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "File Operations",
			"rawText": "File Operations",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "top",
			"containerId": "TaeRTxNLHvJEpplT6a_6R",
			"originalText": "File Operations",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "LpWEDWrk",
			"type": "text",
			"x": 454.8763105273247,
			"y": 37.492530822753906,
			"width": 130.81584894657135,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"zk0wQlgc45-JaPCRpRnFu",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0j",
			"roundness": null,
			"seed": 863781293,
			"version": 37,
			"versionNonce": 1979897187,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "Pagination Logic",
			"rawText": "Pagination Logic",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "top",
			"containerId": "EX9tduE9P4El2CFh-GPBs",
			"originalText": "Pagination Logic",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "fwZaNriF",
			"type": "text",
			"x": 927.4061580300331,
			"y": -117.49246215820312,
			"width": 117.31987464427948,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"SzDsw0RdvM1MXjcViO4vw",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0k",
			"roundness": null,
			"seed": 927040525,
			"version": 39,
			"versionNonce": 1852322051,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "Grouping Logic",
			"rawText": "Grouping Logic",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "top",
			"containerId": "i2wIJt5dXvPxeXkhJ3oaz",
			"originalText": "Grouping Logic",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "ohBBP6bU",
			"type": "text",
			"x": -64.2272402793169,
			"y": -762.4324340820312,
			"width": 196.89581432938576,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"qOFZUrLzmmUOzUyD87g3u",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0l",
			"roundness": null,
			"seed": 1777302125,
			"version": 35,
			"versionNonce": 1424038051,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "ViewerStyles Code Block",
			"rawText": "ViewerStyles Code Block",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "top",
			"containerId": "xn3CuZNjrq493cpDUThZH",
			"originalText": "ViewerStyles Code Block",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "GkksJITl",
			"type": "text",
			"x": 2009.7909662127495,
			"y": -607.4474411010742,
			"width": 222.15175592899323,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"hyAIBtDxURJh_BSk11hdC",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0m",
			"roundness": null,
			"seed": 1414505677,
			"version": 35,
			"versionNonce": 924585027,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "HelperFunctions Code Block",
			"rawText": "HelperFunctions Code Block",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "top",
			"containerId": "KR3Gd4hKNX-6c6ls9LF13",
			"originalText": "HelperFunctions Code Block",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "HdAhJAO5",
			"type": "text",
			"x": -2031.813274204731,
			"y": -762.4324340820312,
			"width": 204.11977350711823,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"b069iyLJOd9Dsf92UvXNF",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0n",
			"roundness": null,
			"seed": 704348973,
			"version": 35,
			"versionNonce": 1761053667,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "InitialSettings Code Block",
			"rawText": "InitialSettings Code Block",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "top",
			"containerId": "i0LLNFRk6PdTV01ue_zkK",
			"originalText": "InitialSettings Code Block",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "OJcONuQl",
			"type": "text",
			"x": -1882.7569828033447,
			"y": -732.630185836792,
			"width": 169.79180908203125,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"b069iyLJOd9Dsf92UvXNF",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0o",
			"roundness": null,
			"seed": 1868338573,
			"version": 37,
			"versionNonce": 1048713091,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "Vault & Query Config",
			"rawText": "Vault & Query Config",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "RHwh8wll1V-3w4O5eG8TZ",
			"originalText": "Vault & Query Config",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "BEbOYnHD",
			"type": "text",
			"x": -1770.618320286274,
			"y": 247.2797720489502,
			"width": 217.3638073205948,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"b069iyLJOd9Dsf92UvXNF",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0p",
			"roundness": null,
			"seed": 1605131245,
			"version": 35,
			"versionNonce": 100282147,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "Dynamic Columns Mapping",
			"rawText": "Dynamic Columns Mapping",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "2qvm5Jun-e8fqcl4Oex7s",
			"originalText": "Dynamic Columns Mapping",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "ggV28GI6",
			"type": "text",
			"x": -2341.149898350239,
			"y": -577.6451928558349,
			"width": 136.4718395471573,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"b069iyLJOd9Dsf92UvXNF",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0q",
			"roundness": null,
			"seed": 318002765,
			"version": 47,
			"versionNonce": 1104040643,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "Pagination Setup",
			"rawText": "Pagination Setup",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "oh2JBXHvVuewF5iUs_OBV",
			"originalText": "Pagination Setup",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "I3EfG93A",
			"type": "text",
			"x": -2090.317455112934,
			"y": -577.6451928558349,
			"width": 123.87187922000885,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"b069iyLJOd9Dsf92UvXNF",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0r",
			"roundness": null,
			"seed": 1678640301,
			"version": 35,
			"versionNonce": 580715107,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "Display Options",
			"rawText": "Display Options",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "ILh3Hut3t2HObQo-XyQFH",
			"originalText": "Display Options",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "1xvTpp9q",
			"type": "text",
			"x": -1852.3419986963272,
			"y": -577.6451928558349,
			"width": 122.8078682422638,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"b069iyLJOd9Dsf92UvXNF",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0s",
			"roundness": null,
			"seed": 379774733,
			"version": 35,
			"versionNonce": 1093975555,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "UI Placeholders",
			"rawText": "UI Placeholders",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "jzPCB6T4M3Oro9M2yzRmp",
			"originalText": "UI Placeholders",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "EtWw0PCz",
			"type": "text",
			"x": 2114.5973014831543,
			"y": -447.66019987487795,
			"width": 108.41586303710938,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"hyAIBtDxURJh_BSk11hdC",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0t",
			"roundness": null,
			"seed": 1026325869,
			"version": 35,
			"versionNonce": 412353955,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "getProperty()",
			"rawText": "getProperty()",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "MgqlX2Yy00CDM5SDyF0Q0",
			"originalText": "getProperty()",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "UY0ov7u3",
			"type": "text",
			"x": 2212.8820724487305,
			"y": -577.6451928558349,
			"width": 114.40788269042969,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"hyAIBtDxURJh_BSk11hdC",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0u",
			"roundness": null,
			"seed": 1593067469,
			"version": 35,
			"versionNonce": 1072257347,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "extractValue()",
			"rawText": "extractValue()",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "ht05Sv4Wu8q8RxH9efHP8",
			"originalText": "extractValue()",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "pA7zH5xk",
			"type": "text",
			"x": 2238.043586730957,
			"y": 524.7572615203858,
			"width": 108.02389526367188,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"hyAIBtDxURJh_BSk11hdC",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0v",
			"roundness": null,
			"seed": 1578354221,
			"version": 35,
			"versionNonce": 1687369955,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "isValidEntry()",
			"rawText": "isValidEntry()",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "sfDRCF8wXoCpiLY0q6ZfO",
			"originalText": "isValidEntry()",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "StFXHUEv",
			"type": "text",
			"x": 1925.8036499023438,
			"y": -577.6451928558349,
			"width": 165.03179931640625,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"hyAIBtDxURJh_BSk11hdC",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0w",
			"roundness": null,
			"seed": 494172301,
			"version": 35,
			"versionNonce": 69215363,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "updateFrontmatter()",
			"rawText": "updateFrontmatter()",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "0T6eB7YBOr50H7rttPChY",
			"originalText": "updateFrontmatter()",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "H4AzWD40",
			"type": "text",
			"x": 2165.872787475586,
			"y": 704.7422545013428,
			"width": 164.77981567382812,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"hyAIBtDxURJh_BSk11hdC",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0x",
			"roundness": null,
			"seed": 1724899053,
			"version": 35,
			"versionNonce": 1716427811,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "truncateTextHelper()",
			"rawText": "truncateTextHelper()",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "vAL2uYPlIXg7f8nRNBAvs",
			"originalText": "truncateTextHelper()",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "ZRkaVeig",
			"type": "text",
			"x": 1901.063247680664,
			"y": 704.7422545013428,
			"width": 138.1238555908203,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"hyAIBtDxURJh_BSk11hdC",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0y",
			"roundness": null,
			"seed": 279935309,
			"version": 35,
			"versionNonce": 1460477891,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "getColumnType()",
			"rawText": "getColumnType()",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "i8FxVBqeKW52TEoN5icPm",
			"originalText": "getColumnType()",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "JdNAD3AF",
			"type": "text",
			"x": -63.275747299194336,
			"y": -732.630185836792,
			"width": 89.99191284179688,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"qOFZUrLzmmUOzUyD87g3u",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b0z",
			"roundness": null,
			"seed": 1684850605,
			"version": 35,
			"versionNonce": 544878435,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "getStyles()",
			"rawText": "getStyles()",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "O01GpUqj0dpcdpGeHI9Y_",
			"originalText": "getStyles()",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "cbGiqQzo",
			"type": "text",
			"x": 90.706428617239,
			"y": -577.6451928558349,
			"width": 129.52786618471146,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"qOFZUrLzmmUOzUyD87g3u",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b10",
			"roundness": null,
			"seed": 1144080909,
			"version": 35,
			"versionNonce": 1155812099,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "Style Definitions",
			"rawText": "Style Definitions",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "AcKmThWP1QtdVlTb6DjdA",
			"originalText": "Style Definitions",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "6g6mIp2K",
			"type": "text",
			"x": 76.5104518532753,
			"y": -447.66019987487795,
			"width": 157.91981971263885,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"qOFZUrLzmmUOzUyD87g3u",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b11",
			"roundness": null,
			"seed": 284590189,
			"version": 35,
			"versionNonce": 2026500771,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "Component Layouts",
			"rawText": "Component Layouts",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "Ec02pJ26mWo9nPFgqDjAh",
			"originalText": "Component Layouts",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "aCGQ8fwT",
			"type": "text",
			"x": 93.84241312742233,
			"y": -267.6752068939209,
			"width": 123.25589716434479,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"qOFZUrLzmmUOzUyD87g3u",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b12",
			"roundness": null,
			"seed": 1350953677,
			"version": 35,
			"versionNonce": 1557767747,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "Dynamic Sizing",
			"rawText": "Dynamic Sizing",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "gnxdKremyYJcvEZhRAxwI",
			"originalText": "Dynamic Sizing",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "qRMMF9dW",
			"type": "text",
			"x": 578.5311145782471,
			"y": -577.6451928558349,
			"width": 135.23985290527344,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b13",
			"roundness": null,
			"seed": 326699309,
			"version": 35,
			"versionNonce": 2012341731,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "Settings Merging",
			"rawText": "Settings Merging",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "PutVtMjXFW4CxbATlLTt-",
			"originalText": "Settings Merging",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "Cw4sWNjZ",
			"type": "text",
			"x": 568.7311173379421,
			"y": -447.66019987487795,
			"width": 154.83984738588333,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b14",
			"roundness": null,
			"seed": 456743821,
			"version": 35,
			"versionNonce": 1898000771,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "State Management",
			"rawText": "State Management",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "-K6jX1nqRu8UJHIunl10l",
			"originalText": "State Management",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "a9JVyxB6",
			"type": "text",
			"x": 882.722334086895,
			"y": -267.6752068939209,
			"width": 114.8278728723526,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b15",
			"roundness": null,
			"seed": 1073766893,
			"version": 35,
			"versionNonce": 161876259,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "Data Querying",
			"rawText": "Data Querying",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "X_hrR9Uye6ILBoShzyOfk",
			"originalText": "Data Querying",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "qW6LHMao",
			"type": "text",
			"x": 878.1863347887993,
			"y": -87.69021391296387,
			"width": 123.899871468544,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"SzDsw0RdvM1MXjcViO4vw",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b16",
			"roundness": null,
			"seed": 383229005,
			"version": 37,
			"versionNonce": 1458498755,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "Filter Validation",
			"rawText": "Filter Validation",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "XK78bn_EZJAAPlFPCz68w",
			"originalText": "Filter Validation",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "wQhSD5pe",
			"type": "text",
			"x": 882.5023517608643,
			"y": 67.29477906799316,
			"width": 135.26783752441406,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"SzDsw0RdvM1MXjcViO4vw",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b17",
			"roundness": null,
			"seed": 1469614765,
			"version": 37,
			"versionNonce": 1016749155,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "Tree Construction",
			"rawText": "Tree Construction",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "qM994QmPe72J2xQJLfeoe",
			"originalText": "Tree Construction",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "Xm04KmlF",
			"type": "text",
			"x": 893.5483266711235,
			"y": 247.2797720489502,
			"width": 113.17588770389557,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"SzDsw0RdvM1MXjcViO4vw",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b18",
			"roundness": null,
			"seed": 49065229,
			"version": 37,
			"versionNonce": 645322755,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751608,
			"link": null,
			"locked": false,
			"text": "Date Handling",
			"rawText": "Date Handling",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "jqFXmP318lDWl6YaQOvIn",
			"originalText": "Date Handling",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "Fuu0sEai",
			"type": "text",
			"x": 910.3203184008598,
			"y": 369.7722685394287,
			"width": 79.63190424442291,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"SzDsw0RdvM1MXjcViO4vw",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b19",
			"roundness": null,
			"seed": 1213039469,
			"version": 37,
			"versionNonce": 42131363,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "Flattening",
			"rawText": "Flattening",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "F7J50ub-BOxa-Jp12HqTK",
			"originalText": "Flattening",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "HYo8bvfz",
			"type": "text",
			"x": 496.4013082385063,
			"y": 67.29477906799316,
			"width": 104.6639095544815,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"zk0wQlgc45-JaPCRpRnFu",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1A",
			"roundness": null,
			"seed": 738495949,
			"version": 37,
			"versionNonce": 2062349123,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "Row Filtering",
			"rawText": "Row Filtering",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "4JCqqjSydFFi1fons0WWW",
			"originalText": "Row Filtering",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "kpP4XUuG",
			"type": "text",
			"x": 509.5335027575493,
			"y": 247.2797720489502,
			"width": 94.751922249794,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"zk0wQlgc45-JaPCRpRnFu",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1B",
			"roundness": null,
			"seed": 1831554093,
			"version": 37,
			"versionNonce": 1880330979,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "Data Slicing",
			"rawText": "Data Slicing",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "e2orvQeBvm4UYCdZZuApB",
			"originalText": "Data Slicing",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "KDpUfoD2",
			"type": "text",
			"x": 490.88553446531296,
			"y": 369.7722685394287,
			"width": 132.04785883426666,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"zk0wQlgc45-JaPCRpRnFu",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1C",
			"roundness": null,
			"seed": 732642957,
			"version": 37,
			"versionNonce": 847593091,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "Header Inclusion",
			"rawText": "Header Inclusion",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "aX29HCHmoz9fC3hXd11Gh",
			"originalText": "Header Inclusion",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "Iw3TooVk",
			"type": "text",
			"x": 517.7935048937798,
			"y": 524.7572615203858,
			"width": 78.23191034793854,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"zk0wQlgc45-JaPCRpRnFu",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1D",
			"roundness": null,
			"seed": 1312679149,
			"version": 37,
			"versionNonce": 2097182243,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "Page Calc",
			"rawText": "Page Calc",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "9BMk73-8-UHV4lmnYE9dt",
			"originalText": "Page Calc",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "XVoCp5h4",
			"type": "text",
			"x": 1590.4617080688477,
			"y": 247.2797720489502,
			"width": 134.34384155273438,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"g7-OaCcoEofh5wslqelOr",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1E",
			"roundness": null,
			"seed": 678215501,
			"version": 37,
			"versionNonce": 779336131,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "onUpdateEntry()",
			"rawText": "onUpdateEntry()",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "lVmfzqjMLYeNX1irRQdtg",
			"originalText": "onUpdateEntry()",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "uFmrJ3vD",
			"type": "text",
			"x": 1347.021987915039,
			"y": 247.2797720489502,
			"width": 128.0718536376953,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"g7-OaCcoEofh5wslqelOr",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1F",
			"roundness": null,
			"seed": 1620135341,
			"version": 37,
			"versionNonce": 1140689251,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "onDeleteEntry()",
			"rawText": "onDeleteEntry()",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "QtUwW_vY4_8RmierPK5q2",
			"originalText": "onDeleteEntry()",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "OvmxdUBm",
			"type": "text",
			"x": 1501.5503044128418,
			"y": 369.7722685394287,
			"width": 124.79583740234375,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"g7-OaCcoEofh5wslqelOr",
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1G",
			"roundness": null,
			"seed": 366284813,
			"version": 37,
			"versionNonce": 317482243,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "Content Parsing",
			"rawText": "Content Parsing",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "3NE-4xvz3SJO0togIL87C",
			"originalText": "Content Parsing",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "TSXhHTVf",
			"type": "text",
			"x": -707.1755884289742,
			"y": -267.6752068939209,
			"width": 167.66382563114166,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1H",
			"roundness": null,
			"seed": 1177650797,
			"version": 35,
			"versionNonce": 1119800483,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "DisplaySettingsEditor",
			"rawText": "DisplaySettingsEditor",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "ypQnnrraBfl3x57HnSSY6",
			"originalText": "DisplaySettingsEditor",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "yeT5pfx6",
			"type": "text",
			"x": -467.18175107240677,
			"y": 67.29477906799316,
			"width": 114.37989008426666,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1I",
			"roundness": null,
			"seed": 1953509581,
			"version": 35,
			"versionNonce": 119750723,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "DraggableLink",
			"rawText": "DraggableLink",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "GVWmEk9xro-m9uPbjxKBn",
			"originalText": "DraggableLink",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "YfeipMef",
			"type": "text",
			"x": -667.537280857563,
			"y": 67.29477906799316,
			"width": 91.92389643192291,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1J",
			"roundness": null,
			"seed": 237670189,
			"version": 35,
			"versionNonce": 435699683,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "EditableCell",
			"rawText": "EditableCell",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "-R5vDK03JWnZnbfC0erDe",
			"originalText": "EditableCell",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "1AyHANYf",
			"type": "text",
			"x": -1011.010238468647,
			"y": 247.2797720489502,
			"width": 78.59592401981354,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"mw079WuoWV3HJLBrAaMgP",
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1K",
			"roundness": null,
			"seed": 298459533,
			"version": 39,
			"versionNonce": 1967934339,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "DataTable",
			"rawText": "DataTable",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "e7h5BWLqQMmtoYvue29RZ",
			"originalText": "DataTable",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "l5QOIoHq",
			"type": "text",
			"x": -1021.1602361798286,
			"y": 369.7722685394287,
			"width": 98.89592707157135,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"mw079WuoWV3HJLBrAaMgP",
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1L",
			"roundness": null,
			"seed": 1955096557,
			"version": 37,
			"versionNonce": 1297998627,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "RenderRows",
			"rawText": "RenderRows",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "Rm9Se3rh1W2q8q9Ejjk4B",
			"originalText": "RenderRows",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "TuaTy2EL",
			"type": "text",
			"x": -1006.3902320861816,
			"y": 524.7572615203858,
			"width": 69.35592651367188,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"mw079WuoWV3HJLBrAaMgP",
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1M",
			"roundness": null,
			"seed": 1215226445,
			"version": 37,
			"versionNonce": 1251706563,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "TableCell",
			"rawText": "TableCell",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "prvry6qI5vVUiKDKRNshc",
			"originalText": "TableCell",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "8CS6SXpg",
			"type": "text",
			"x": -1261.8866441845894,
			"y": -267.6752068939209,
			"width": 134.11988031864166,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"H_M7mu7RTfI-Uam1h8jlD",
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1N",
			"roundness": null,
			"seed": 576131245,
			"version": 37,
			"versionNonce": 61060707,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "EditColumnBlock",
			"rawText": "EditColumnBlock",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "YUq14b1frUrEuZ4J1tJDr",
			"originalText": "EditColumnBlock",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "UTpKi1cx",
			"type": "text",
			"x": -1195.2001495361328,
			"y": -87.69021391296387,
			"width": 89.71189880371094,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"H_M7mu7RTfI-Uam1h8jlD",
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1O",
			"roundness": null,
			"seed": 1072329485,
			"version": 37,
			"versionNonce": 927265283,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "AddColumn",
			"rawText": "AddColumn",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "sLrpRUPevSoLLr_D5cfSN",
			"originalText": "AddColumn",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "AYS2IBN9",
			"type": "text",
			"x": -1225.8601150512695,
			"y": 67.29477906799316,
			"width": 151.03182983398438,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"H_M7mu7RTfI-Uam1h8jlD",
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1P",
			"roundness": null,
			"seed": 1839368557,
			"version": 37,
			"versionNonce": 1182644643,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "Column Reordering",
			"rawText": "Column Reordering",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "0ea8U9GUaNdwo3cQH58EX",
			"originalText": "Column Reordering",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "bDVHoljj",
			"type": "text",
			"x": -843.5206411480904,
			"y": -87.69021391296387,
			"width": 154.5878063440323,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"kxNn3SLuu6f6NlyDaHKAl",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1Q",
			"roundness": null,
			"seed": 751358925,
			"version": 35,
			"versionNonce": 1853656387,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "Pagination Controls",
			"rawText": "Pagination Controls",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "TKLJsXzW5Vjt4HSOHFC53",
			"originalText": "Pagination Controls",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "o9UuYcOz",
			"type": "text",
			"x": -1678.627004710488,
			"y": -242.68917923071027,
			"width": 34.38397580385208,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"b069iyLJOd9Dsf92UvXNF",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1R",
			"roundness": null,
			"seed": 427217453,
			"version": 38,
			"versionNonce": 1117777123,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "Sets",
			"rawText": "Sets",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "tIqzzdMTvP-OxIiJCe0Xx",
			"originalText": "Sets",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "A5g90yv1",
			"type": "text",
			"x": -2302.7616113629338,
			"y": -667.6374340820312,
			"width": 59.695945382118225,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"b069iyLJOd9Dsf92UvXNF",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1S",
			"roundness": null,
			"seed": 278267021,
			"version": 37,
			"versionNonce": 1719031939,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "Defines",
			"rawText": "Defines",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "1rV2FrN8Qd60I_hNOKdQ7",
			"originalText": "Defines",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "eJlTdalo",
			"type": "text",
			"x": -2070.185588445187,
			"y": -667.6374340820313,
			"width": 83.60789954662323,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"b069iyLJOd9Dsf92UvXNF",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1T",
			"roundness": null,
			"seed": 366996205,
			"version": 37,
			"versionNonce": 129912867,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "Configures",
			"rawText": "Configures",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "ZuHwpiI2rEqXGZ90O0xtT",
			"originalText": "Configures",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "0fgqHlh7",
			"type": "text",
			"x": -1824.4956028180122,
			"y": -667.6374340820313,
			"width": 67.11592829227448,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"b069iyLJOd9Dsf92UvXNF",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1U",
			"roundness": null,
			"seed": 2044593485,
			"version": 36,
			"versionNonce": 409359299,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751609,
			"link": null,
			"locked": false,
			"text": "Provides",
			"rawText": "Provides",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "LqDWplcBsB7j3F35c_tHH",
			"originalText": "Provides",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "wPmgfDJi",
			"type": "text",
			"x": 2272.3909339976967,
			"y": 42.49119807482033,
			"width": 38.191977739334106,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"hyAIBtDxURJh_BSk11hdC",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1V",
			"roundness": null,
			"seed": 1072288685,
			"version": 36,
			"versionNonce": 1217192803,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751610,
			"link": null,
			"locked": false,
			"text": "Uses",
			"rawText": "Uses",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "qxNNAKBx-GBM05cSZgrK9",
			"originalText": "Uses",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "GgVVouD4",
			"type": "text",
			"x": 2235.0723977181915,
			"y": -512.6524340820313,
			"width": 70.0279272198677,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"hyAIBtDxURJh_BSk11hdC",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1W",
			"roundness": null,
			"seed": 1143789069,
			"version": 35,
			"versionNonce": 1082162947,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751610,
			"link": null,
			"locked": false,
			"text": "Supports",
			"rawText": "Supports",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "5U-r2iLIYnP-gCw2NspkM",
			"originalText": "Supports",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "1a4Pzw48",
			"type": "text",
			"x": 1974.6353923370834,
			"y": -512.6524340820313,
			"width": 67.36793798208237,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"hyAIBtDxURJh_BSk11hdC",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1X",
			"roundness": null,
			"seed": 564169837,
			"version": 35,
			"versionNonce": 448767651,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751610,
			"link": null,
			"locked": false,
			"text": "Modifies",
			"rawText": "Modifies",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "555JFpA1LVe-bAUd-WOrH",
			"originalText": "Modifies",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "NfdsXdDW",
			"type": "text",
			"x": 125.11839083433142,
			"y": -667.6374340820313,
			"width": 60.703940987586975,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"qOFZUrLzmmUOzUyD87g3u",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1Y",
			"roundness": null,
			"seed": 1477342925,
			"version": 37,
			"versionNonce": 502848067,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751610,
			"link": null,
			"locked": false,
			"text": "Returns",
			"rawText": "Returns",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "pS0t-bX6iYs75i8NkzuJZ",
			"originalText": "Returns",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "7zTwSZN5",
			"type": "text",
			"x": 122.76639345884314,
			"y": -512.6524340820313,
			"width": 65.40793573856354,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"qOFZUrLzmmUOzUyD87g3u",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1Z",
			"roundness": null,
			"seed": 839914797,
			"version": 35,
			"versionNonce": 923441635,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751610,
			"link": null,
			"locked": false,
			"text": "Includes",
			"rawText": "Includes",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "JEN4Z3KAgTvZ_KF_KxMn5",
			"originalText": "Includes",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "Qfj2N16A",
			"type": "text",
			"x": 124.16937184649578,
			"y": -361.4461694512537,
			"width": 64.39994013309479,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"qOFZUrLzmmUOzUyD87g3u",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1a",
			"roundness": null,
			"seed": 1796138893,
			"version": 36,
			"versionNonce": 855860611,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751610,
			"link": null,
			"locked": false,
			"text": "Handles",
			"rawText": "Handles",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "pWqEWKkgPIm81JJ438V4s",
			"originalText": "Handles",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "u7hpUtn7",
			"type": "text",
			"x": -515.2003223614694,
			"y": -581.0139439130651,
			"width": 122.52786982059479,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b1b",
			"roundness": null,
			"seed": 356806125,
			"version": 32,
			"versionNonce": 958512419,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751610,
			"link": null,
			"locked": false,
			"text": "Provides Config",
			"rawText": "Provides Config",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "kj2u5EmSLawPu0DnbbPGA",
			"originalText": "Provides Config",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "L7pZEcIZ",
			"type": "text",
			"x": 292.62620052123066,
			"y": -610.5901567061619,
			"width": 48.01996213197708,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1c",
			"roundness": null,
			"seed": 1069164621,
			"version": 38,
			"versionNonce": 81010883,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751610,
			"link": null,
			"locked": false,
			"text": "Styles",
			"rawText": "Styles",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "NkEQcmmOXFiqCO_w02ePC",
			"originalText": "Styles",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "7MXPjehI",
			"type": "text",
			"x": -272.15213443970674,
			"y": -306.1065902093035,
			"width": 48.01996213197708,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1d",
			"roundness": null,
			"seed": 1548326573,
			"version": 40,
			"versionNonce": 1605963875,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751610,
			"link": null,
			"locked": false,
			"text": "Styles",
			"rawText": "Styles",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "iktjHotKfcXMxguPVp4ET",
			"originalText": "Styles",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "MfV2XdAz",
			"type": "text",
			"x": 1396.9734135568142,
			"y": -274.3352759007433,
			"width": 70.0279272198677,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b1e",
			"roundness": null,
			"seed": 1704737037,
			"version": 32,
			"versionNonce": 1537149955,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751610,
			"link": null,
			"locked": false,
			"text": "Supports",
			"rawText": "Supports",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "fwlmycFCjo666ejf9fxaV",
			"originalText": "Supports",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "FbKiSIF2",
			"type": "text",
			"x": 610.403413556814,
			"y": 63.36404978842482,
			"width": 70.0279272198677,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b1f",
			"roundness": null,
			"seed": 1160482669,
			"version": 32,
			"versionNonce": 1283756963,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751610,
			"link": null,
			"locked": false,
			"text": "Supports",
			"rawText": "Supports",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "eDmyCbqC4ht4Is3zorGPs",
			"originalText": "Supports",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "QwIrfB89",
			"type": "text",
			"x": 766.8081077617992,
			"y": -198.85896010554526,
			"width": 121.2398830652237,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1g",
			"roundness": null,
			"seed": 2034309581,
			"version": 36,
			"versionNonce": 43525955,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751610,
			"link": null,
			"locked": false,
			"text": "Processed Data",
			"rawText": "Processed Data",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "_HXvwDZoBII3iJW1Cy8Uu",
			"originalText": "Processed Data",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "f1zJNC2m",
			"type": "text",
			"x": 642.4999406814575,
			"y": 24.320844993902615,
			"width": 123.89985656738281,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1h",
			"roundness": null,
			"seed": 2062964781,
			"version": 41,
			"versionNonce": 1144538851,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751610,
			"link": null,
			"locked": false,
			"text": "Structured Data",
			"rawText": "Structured Data",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "4OUCC0iiWe5HpCoDnZ8Ed",
			"originalText": "Structured Data",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "C2ZwPFbO",
			"type": "text",
			"x": -316.11270440340036,
			"y": 200.05880233198408,
			"width": 122.2198635339737,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b1i",
			"roundness": null,
			"seed": 1681181325,
			"version": 35,
			"versionNonce": 133395075,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751610,
			"link": null,
			"locked": false,
			"text": "Paginated Data",
			"rawText": "Paginated Data",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "4_Wludr31gnxxpd0K4S3A",
			"originalText": "Paginated Data",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "1wbrNwMk",
			"type": "text",
			"x": -610.1225870099067,
			"y": 157.28756591796875,
			"width": 95.36789667606354,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b1j",
			"roundness": null,
			"seed": 1437987053,
			"version": 35,
			"versionNonce": 1854417443,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751610,
			"link": null,
			"locked": false,
			"text": "Drag Events",
			"rawText": "Drag Events",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "p0TKb2ucN-oItF7biLZoC",
			"originalText": "Drag Events",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "yH88vT17",
			"type": "text",
			"x": -468.73761984682073,
			"y": 157.28756591796875,
			"width": 38.30396234989166,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b1k",
			"roundness": null,
			"seed": 486755149,
			"version": 39,
			"versionNonce": 2095377859,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751610,
			"link": null,
			"locked": false,
			"text": "Edits",
			"rawText": "Edits",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "iekKZp05e4wU-Hd1GSrnv",
			"originalText": "Edits",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "baNXB1Rh",
			"type": "text",
			"x": -1352.439171245857,
			"y": 179.24899851109868,
			"width": 133.44785010814667,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b1l",
			"roundness": null,
			"seed": 443963821,
			"version": 32,
			"versionNonce": 371735907,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751610,
			"link": null,
			"locked": false,
			"text": "Column Changes",
			"rawText": "Column Changes",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "5bj4bt_UyYAbhtn4gKxQ0",
			"originalText": "Column Changes",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "3PD0wdjl",
			"type": "text",
			"x": 524.7653999581339,
			"y": -218.92943408203124,
			"width": 64.2879227399826,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1m",
			"roundness": null,
			"seed": 1731763213,
			"version": 35,
			"versionNonce": 899717379,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751610,
			"link": null,
			"locked": false,
			"text": "Controls",
			"rawText": "Controls",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "PZ3wYrFtRseHuwe8ppnxb",
			"originalText": "Controls",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "OlyOeNVy",
			"type": "text",
			"x": 410.3173999581336,
			"y": -341.4214340820313,
			"width": 64.2879227399826,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b1n",
			"roundness": null,
			"seed": 994284141,
			"version": 31,
			"versionNonce": 1758232739,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751610,
			"link": null,
			"locked": false,
			"text": "Controls",
			"rawText": "Controls",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "OBKMBnGMOruKoV4rXPJIP",
			"originalText": "Controls",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "MO9rPr1D",
			"type": "text",
			"x": 703.7043930664063,
			"y": -341.4214340820313,
			"width": 60.0599365234375,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [
				"iw_vdAfT3PSRu7kkN6Uk0",
				"7HSKnUT7ezhsEwZtBZhaP"
			],
			"frameId": null,
			"index": "b1o",
			"roundness": null,
			"seed": 325106893,
			"version": 35,
			"versionNonce": 156922947,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751610,
			"link": null,
			"locked": false,
			"text": "Triggers",
			"rawText": "Triggers",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "d_ZwPkuCNg_NCBlX2J5wZ",
			"originalText": "Triggers",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "IFQRLfsN",
			"type": "text",
			"x": -52.32760467529306,
			"y": -267.6754340820313,
			"width": 68.09593200683594,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b1p",
			"roundness": null,
			"seed": 388602669,
			"version": 32,
			"versionNonce": 925430755,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751611,
			"link": null,
			"locked": false,
			"text": "Theming",
			"rawText": "Theming",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "94oC8ZUWBBYfTqWfH4zfd",
			"originalText": "Theming",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "9DYXpUto",
			"type": "text",
			"x": -204.66118076764104,
			"y": -479.95783711146487,
			"width": 68.09593200683594,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b1q",
			"roundness": null,
			"seed": 1057467789,
			"version": 32,
			"versionNonce": 306610051,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751611,
			"link": null,
			"locked": false,
			"text": "Theming",
			"rawText": "Theming",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "c_WP35ptJL5kUzAhZt_3s",
			"originalText": "Theming",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "Gb2obMvb",
			"type": "text",
			"x": -396.2131690275856,
			"y": -200.51784843889894,
			"width": 149.0438610315323,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b1r",
			"roundness": null,
			"seed": 976516077,
			"version": 32,
			"versionNonce": 888248099,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751611,
			"link": null,
			"locked": false,
			"text": "Responsive Layout",
			"rawText": "Responsive Layout",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "1FLh6jFTad8n_v7Q2KuWc",
			"originalText": "Responsive Layout",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "uN1Hiqn1",
			"type": "text",
			"x": 1481.9260550842073,
			"y": 439.2775423300744,
			"width": 78.14791870117188,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b1s",
			"roundness": null,
			"seed": 347696717,
			"version": 32,
			"versionNonce": 1838725827,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751611,
			"link": null,
			"locked": false,
			"text": "Validation",
			"rawText": "Validation",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "vJyx8Jye5-uxK7204eyoA",
			"originalText": "Validation",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "ER9EUJ24",
			"type": "text",
			"x": 1093.1971762371088,
			"y": 222.51600666886762,
			"width": 106.90388453006744,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b1t",
			"roundness": null,
			"seed": 493886637,
			"version": 32,
			"versionNonce": 953838179,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751611,
			"link": null,
			"locked": false,
			"text": "Data Filtering",
			"rawText": "Data Filtering",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "0VWYbEbtlwYDAk6_svx8L",
			"originalText": "Data Filtering",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "8mQZ1P41",
			"type": "text",
			"x": -821.5761550997544,
			"y": 223.18935712603812,
			"width": 110.03986322879791,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b1u",
			"roundness": null,
			"seed": 201457421,
			"version": 32,
			"versionNonce": 2072323587,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751611,
			"link": null,
			"locked": false,
			"text": "Page Controls",
			"rawText": "Page Controls",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "YzRqsPOhHHag4KVeavDTV",
			"originalText": "Page Controls",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "IHzrEHZv",
			"type": "text",
			"x": -1207.4645750784873,
			"y": 157.28756591796875,
			"width": 114.23987281322479,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b1v",
			"roundness": null,
			"seed": 1726518637,
			"version": 31,
			"versionNonce": 2090298787,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751611,
			"link": null,
			"locked": false,
			"text": "Order Updates",
			"rawText": "Order Updates",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "ncdAUnDbcow1ZgL9fcuHu",
			"originalText": "Order Updates",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "jiMqSZeO",
			"type": "text",
			"x": -1011.6825977520944,
			"y": 598.5035659179689,
			"width": 79.93991816043854,
			"height": 27.887999999999998,
			"angle": 0,
			"strokeColor": "#FFFFFF",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 2,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b1w",
			"roundness": null,
			"seed": 695033805,
			"version": 33,
			"versionNonce": 524271939,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269751611,
			"link": null,
			"locked": false,
			"text": "Rendering",
			"rawText": "Rendering",
			"fontSize": 28,
			"fontFamily": 4,
			"textAlign": "center",
			"verticalAlign": "middle",
			"containerId": "nPjDzw9tpU_BMjFxXjiQa",
			"originalText": "Rendering",
			"autoResize": true,
			"lineHeight": 0.996
		},
		{
			"id": "SdG-lGC6jVsd7jLK2vY28",
			"type": "rectangle",
			"x": -2477.8904444589043,
			"y": -843.4359882694258,
			"width": 4944.540311388604,
			"height": 1688.8762488886032,
			"angle": 0,
			"strokeColor": "#6327d3",
			"backgroundColor": "transparent",
			"fillStyle": "solid",
			"strokeWidth": 4,
			"strokeStyle": "solid",
			"roughness": 1,
			"opacity": 100,
			"groupIds": [],
			"frameId": null,
			"index": "b1x",
			"roundness": null,
			"seed": 321012813,
			"version": 819,
			"versionNonce": 1509683235,
			"isDeleted": false,
			"boundElements": [],
			"updated": 1742269815344,
			"link": null,
			"locked": false
		}
	],
	"appState": {
		"theme": "light",
		"viewBackgroundColor": "#000000",
		"currentItemStrokeColor": "#FFFFFF",
		"currentItemBackgroundColor": "transparent",
		"currentItemFillStyle": "solid",
		"currentItemStrokeWidth": 2,
		"currentItemStrokeStyle": "solid",
		"currentItemRoughness": 1,
		"currentItemOpacity": 100,
		"currentItemFontFamily": 4,
		"currentItemFontSize": 28,
		"currentItemTextAlign": "left",
		"currentItemStartArrowhead": null,
		"currentItemEndArrowhead": "arrow",
		"currentItemArrowType": "round",
		"scrollX": 2608.0053134700374,
		"scrollY": 2354.2357427209813,
		"zoom": {
			"value": 0.21048
		},
		"currentItemRoundness": "round",
		"gridSize": 20,
		"gridStep": 5,
		"gridModeEnabled": false,
		"gridColor": {
			"Bold": "rgba(38, 38, 38, 0.5)",
			"Regular": "rgba(26, 26, 26, 0.5)"
		},
		"colorPalette": {
			"elementStroke": [
				"#FFFFFF",
				"#BFC5CB",
				"#A8AFB6",
				"#D53636",
				"#E15988",
				"#BB63D1",
				"#5D3BC2",
				"#3851C9",
				"#54A0E7",
				"#7AE1F4",
				"#80F7D3",
				"#75D488",
				"#BAF26B",
				"#FF9019",
				"#F05F26"
			],
			"elementBackground": [
				"transparent",
				"#252B31",
				"#697179",
				"#AD0505",
				"#B61950",
				"#9724B4",
				"#360DAF",
				"#0A2CB3",
				"#1982DD",
				"#40D5EA",
				"#47EDBB",
				"#3FBF56",
				"#9AE136",
				"#FAB005",
				"#EB6C02"
			],
			"canvasBackground": [
				"#000000",
				"#050607",
				"#0A0C0E",
				"#0A0000",
				"#0F0006",
				"#0B030F",
				"#03000F",
				"#000512",
				"#000E18",
				"#031A1C",
				"#031912",
				"#041407",
				"#141C03",
				"#241E00",
				"#190E00"
			]
		},
		"currentStrokeOptions": null,
		"frameRendering": {
			"enabled": true,
			"clip": true,
			"name": true,
			"outline": true
		},
		"objectsSnapModeEnabled": false,
		"activeTool": {
			"type": "selection",
			"customType": null,
			"locked": false,
			"lastActiveTool": null
		}
	},
	"files": {}
}
```
%%