# Architecting the Foundation: Decoupling Storage at the Edge

Welcome to the first installment of my homelab architectural deep-dive. After a decade of engineering infrastructure, observability pipelines, and distributed systems at scale, I've reached a point where my own environment requires the same level of rigor and documentation as a production data center.

This environment is currently undergoing a complete architectural overhaul. As the deployment has matured, the concept of a single, monolithic cluster has become an anti-pattern. Instead, the infrastructure is now structured to enforce strict state isolation across network, storage, and compute—all managed via GitOps. As the compute layer transitions to a hyper-converged Proxmox cluster running on HP EliteDesk 800 G6 nodes, the storage architecture must respect that decoupling. Compute nodes are ephemeral and highly available; the storage backend needs to be permanent, isolated, and engineered for resilience.

Therefore, the absolute first step in this homelab journey is establishing the physical foundation of the storage tier. We are building a dedicated network-attached storage (NAS) appliance capable of feeding the Proxmox nodes over the network without introducing brittle dependencies.

![The hardware stack for the new decoupled storage tier](assets/images/blog/homelab-storage/hardware-stack.jpg)

## The Edge Appliance: Compute for Storage

When evaluating the physical host for this array, raw capacity was only one variable. The appliance needed to balance low idle power consumption with the PCIe lane density required to support NVMe caching and multi-gigabit network saturation.

![The UGREEN NASync DXP4800 Plus chassis](assets/images/blog/homelab-storage/chassis.jpg)

The **UGREEN NASync DXP4800 Plus** fits this exact profile. Powered by an Intel Pentium Gold 8505, it provides the necessary compute overhead to handle real-time volume encryption, file system checksumming (ZFS/BTRFS), and network throughput without becoming a bottleneck. It acts as the dedicated, independent edge device serving the compute nodes via NFS or iSCSI.

## The Capacity Tier: The CMR Mandate

A robust storage architecture requires deliberate tiering. For the primary capacity pool—handling long-term log aggregation, media, and automated backups—the array utilizes three Western Digital Red Plus 8TB drives.

![WD Red Plus 8TB: Ensuring stable write latency under sustained load](assets/images/blog/homelab-storage/mechanical-disks.jpg)

When engineering a NAS, validating the magnetic recording technology of the disks is a critical hardware decision. These are **Conventional Magnetic Recording (CMR)** drives.

> ### ⚠️ The SMR Trap
>
> The market is currently saturated with Shingled Magnetic Recording (SMR) drives, which are fundamentally incompatible with resilient parity arrays. SMR drives experience catastrophic IOPS degradation during continuous write operations or array rebuilds.

By strictly enforcing the use of CMR drives, the architecture guarantees predictable latency and safe rebuild times. Running three of these in a RAID 5/parity configuration yields a highly available bulk pool with single-disk fault tolerance.

## The Performance Tier: Engineering for IOPS

Bulk storage handles archiving, but infrastructure-as-code (IaC) workflows demand IOPS. When Proxmox VMs are booting, or when Terraform and FluxCD are querying state files, storage latency must be virtually non-existent.

![Dual Gen 4 NVMe drives installed directly to the mainboard for high-IOPS workloads](assets/images/blog/homelab-storage/nvme-drives.jpg)

To solve for this, the hot tier utilizes dual **Samsung 990 EVO Plus 1TB NVMe SSDs**. Populating the internal PCIe Gen 4 M.2 slots provides a mirrored 1TB flash pool. This dual-tier approach offers architectural flexibility: these drives can be configured as an L2ARC/ZIL caching layer to accelerate the mechanical disks, or they can be presented directly to Proxmox as a dedicated, ultra-fast block volume for critical databases and state files.

## Power Resiliency: Protecting In-Flight Data

A storage system is only as robust as its power delivery. A sudden power loss during an active write operation is the fastest route to file system corruption and catastrophic data loss.

![UGREEN 120W DC UPS providing localized battery backup](assets/images/blog/homelab-storage/dc-ups.jpg)

Rather than relying entirely on a broader rack-level AC UPS, this architecture implements a localized **UGREEN 120W DC UPS** directly inline with the NAS. Because it outputs DC power straight to the appliance, it offers a zero-millisecond transfer time. This targeted redundancy measure ensures that if upstream power fails, the storage array maintains power long enough to flush all volatile write caches to non-volatile disk and execute a graceful automated shutdown.

## Assembly and Final Integration

The assembly process is straightforward but requires precision to ensure proper airflow and secure connections.

![Assembly of the storage array components](assets/images/blog/homelab-storage/assembly.jpg)

The physical foundation is now racked, cabled, and powered. The state has been isolated into a resilient, tiered hardware appliance.

![Final setup and integration - View 1](assets/images/blog/homelab-storage/final-setup-1.jpg)

![Final setup and integration - View 2](assets/images/blog/homelab-storage/final-setup-2.jpg)

---

## Hardware Specification Manifest

| Component            | Model                       | Role                  | Key Specification          |
| -------------------- | --------------------------- | --------------------- | -------------------------- |
| **Chassis/CPU**      | UGREEN NASync DXP4800 Plus  | Storage Controller    | Intel Pentium Gold 8505    |
| **Capacity Disks**   | 3x WD Red Plus 8TB          | Bulk Storage Pool     | CMR, 5600 RPM, SATA 6Gb/s  |
| **Performance SSD**  | 2x Samsung 990 EVO Plus 1TB | Flash Tier / Cache    | NVMe Gen 4, 7450 MB/s Read |
| **Power Protection** | UGREEN 120W DC UPS          | Local Power Fail-safe | 0ms Transfer, DC-to-DC     |

## Moving Up the Stack

With the hardware engineered, the next phase shifts to the software layer. Future posts will break down the block storage formatting, the network share configuration, and the Terraform modules required to seamlessly integrate this appliance into the homelab's GitOps pipeline.

Stay tuned as we move from physical bits to logical bytes.
