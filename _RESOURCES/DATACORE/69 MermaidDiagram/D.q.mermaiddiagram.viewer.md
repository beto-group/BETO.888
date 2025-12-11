







```datacorejsx
const { View } = await dc.require(dc.headerLink(dc.resolvePath("D.q.mermaiddiagram.component.md"), "ViewComponent"));

const code = `
flowchart TD

    %% ==========================================
    %% STYLING
    %% ==========================================
    classDef cluster fill:#0a0a0a,stroke:#333,stroke-width:2px,color:#fff;
    classDef storage fill:#1e1e2e,stroke:#8b5cf6,stroke-width:2px,color:#fff;
    classDef compute fill:#1e1e2e,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef external fill:#1e1e2e,stroke:#f59e0b,stroke-width:2px,color:#fff;
    classDef default fill:#000,stroke:#8b5cf6,stroke-width:1px,color:#fff;

    %% ==========================================
    %% 1. USERS & CLIENTS
    %% ==========================================
    subgraph UserZone ["Users & Clients"]
        direction TB
        PF[Preact Frontend]
        OP[Obsidian Plugin]
        OC[Overseer Component]
    end

    %% ==========================================
    %% 2. EDGE LAYER (CLOUDFLARE)
    %% ==========================================
    subgraph EdgeServices ["Edge Layer (Cloudflare)"]
        direction TB
        CDNS[Cloudflare DNS]
        CCDN[Cloudflare CDN]
        CP[Cloudflare Pages]
        
        %% Storage
        subgraph CloudflareR2 ["R2 Storage Buckets"]
            R2Pub[("R2 assets-public")]:::storage
            R2Priv[("R2 vault-private")]:::storage
            R2Quar[("R2 quarantine-staging")]:::storage
            R2Back[("R2 backup-archive")]:::storage
        end
    end

    %% ==========================================
    %% 3. CORE INFRASTRUCTURE (VPS + K3s)
    %% ==========================================
    subgraph CoreInfra ["Core Infrastructure (Contabo VPS / K3s)"]
        direction TB
        
        subgraph IngressLayer ["Ingress Layer"]
            Traefik[Traefik Ingress]
            CertMgr[CertManager]
        end

        subgraph CoreSvcs ["Core Services"]
            Backend[Marketplace Backend API]:::compute
            Flux[FluxCD Agent]
            Sealed[Sealed Secrets]
        end

        subgraph DataLayer ["Data Layer"]
            PG[(PostgreSQL)]:::storage
            Redis[(Redis)]:::storage
        end

        subgraph MonitorStack ["Monitoring Stack"]
            Prom[Prometheus]
            Graf[Grafana]
            Loki[Loki]
            Alert[Alertmanager]
        end

        subgraph BackupLayer ["Backup Layer"]
            Velero[Velero]
        end
    end

    %% ==========================================
    %% 4. EXTERNAL SERVICES
    %% ==========================================
    subgraph ExternalSaaS ["External SaaS"]
        GH[GitHub]:::external
        Paddle[Paddle]:::external
        SES[AWS SES]:::external
        Discord[Discord]:::external
    end

    %% ==========================================
    %% CONNECTIONS
    %% ==========================================

    %% --- Frontend User Flow ---
    PF -->|API Requests| Traefik
    PF -->|Loads App| CCDN
    CCDN -->|Origin| CP
    CCDN -->|Fetch Video Previews| R2Pub

    %% --- The Secure Handshake (Obsidian Plugin) ---
    OP -->|POST /api/deploy/token| Traefik
    Traefik -->|Routes Request| Backend
    Backend -->|1. Generate Token| Redis
    Backend -->|2. Verify Purchase| PG
    OP -->|GET /api/download/:id| Traefik
    Backend -->|3. Verify Token| Redis
    Backend -->|4. Request Presigned URL| R2Priv
    Backend -.->|5. Redirect| OP
    OP -.->|6. Download Zip| R2Priv

    %% --- The Air Lock (Vendor Upload) ---
    PF -->|Upload| Backend
    Backend -->|Store Staging| R2Quar
    OC -->|Secure Admin API| Backend
    Backend -->|Fetch for Inspect| R2Quar
    Backend -->|Promote if Approved| R2Priv
    Backend -->|Delete if Rejected| R2Quar

    %% --- Data & Ops ---
    Backend <-->|Read/Write| PG
    Backend <-->|Cache/Rate Limit| Redis
    Backend -->|Send Magic Link| SES
    Paddle -->|Webhook Sales| Traefik

    %% --- DevOps (GitOps) ---
    GH -->|Actions Build Docker| Backend
    Flux -->|Watch Updates| GH
    Flux -->|Update Pods| Backend
    Flux -->|Trigger Migration| PG
    Sealed -->|Decrypt Keys| Backend

    %% --- Monitoring & Backup ---
    Prom -->|Scrape Metrics| Backend
    Loki -->|Collect Logs| Backend
    Alert -->|Send Alerts| Discord
    Velero -->|Daily Snapshot| R2Back
`;

return <View initialCode={code} initialEditorVisible={false} />;
```




