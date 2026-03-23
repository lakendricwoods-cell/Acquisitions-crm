"use client"

import { useState, type CSSProperties } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import ActionButton from "@/components/ui/action-button"

type QuickActionType = "lead" | "task" | "buyer" | null

export default function CrmQuickActions() {
  const router = useRouter()

  const [open, setOpen] = useState<QuickActionType>(null)
  const [saving, setSaving] = useState(false)

  const [leadAddress, setLeadAddress] = useState("")
  const [leadOwner, setLeadOwner] = useState("")
  const [leadPhone, setLeadPhone] = useState("")

  const [taskTitle, setTaskTitle] = useState("")
  const [taskPriority, setTaskPriority] = useState("medium")

  const [buyerName, setBuyerName] = useState("")
  const [buyerEmail, setBuyerEmail] = useState("")
  const [buyerPhone, setBuyerPhone] = useState("")

  const resetAll = () => {
    setLeadAddress("")
    setLeadOwner("")
    setLeadPhone("")
    setTaskTitle("")
    setTaskPriority("medium")
    setBuyerName("")
    setBuyerEmail("")
    setBuyerPhone("")
  }

  const closeModal = () => {
    setOpen(null)
    resetAll()
  }

  const handleCreateLead = async () => {
    if (!leadAddress.trim()) {
      alert("Property address is required")
      return
    }

    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setSaving(false)
      alert("You must be logged in")
      return
    }

    const { error } = await supabase.from("leads").insert({
      property_address_1: leadAddress.trim(),
      owner_name: leadOwner.trim() || null,
      owner_phone_primary: leadPhone.trim() || null,
      status: "new_lead",
      lead_source: "manual",
      contact_attempts: 0,
      assignment_fee_target: 15000,
      created_by_user_id: user.id,
      assigned_user_id: user.id,
    })

    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    closeModal()
    router.refresh()
  }

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) {
      alert("Task title is required")
      return
    }

    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setSaving(false)
      alert("You must be logged in")
      return
    }

    const { error } = await supabase.from("tasks").insert({
      title: taskTitle.trim(),
      priority: taskPriority,
      status: "open",
      created_by_user_id: user.id,
      assigned_user_id: user.id,
    })

    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    closeModal()
    router.refresh()
  }

  const handleCreateBuyer = async () => {
    if (!buyerName.trim()) {
      alert("Buyer name is required")
      return
    }

    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setSaving(false)
      alert("You must be logged in")
      return
    }

    const { error } = await supabase.from("buyers").insert({
      full_name: buyerName.trim(),
      email: buyerEmail.trim() || null,
      phone: buyerPhone.trim() || null,
      created_by_user_id: user.id,
    })

    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    closeModal()
    router.refresh()
  }

  return (
    <>
      <div style={barStyle}>
        <ActionButton onClick={() => setOpen("lead")} tone="gold">
          + Lead
        </ActionButton>
        <ActionButton onClick={() => setOpen("task")}>+ Task</ActionButton>
        <ActionButton onClick={() => setOpen("buyer")}>+ Buyer</ActionButton>
        <ActionButton onClick={() => router.push("/imports")}>Import</ActionButton>
      </div>

      {open ? (
        <div style={overlayStyle} onClick={closeModal}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            {open === "lead" && (
              <>
                <div style={titleStyle}>Create Lead</div>
                <div style={formStyle}>
                  <input
                    value={leadAddress}
                    onChange={(e) => setLeadAddress(e.target.value)}
                    placeholder="Property address"
                    style={inputStyle}
                  />
                  <input
                    value={leadOwner}
                    onChange={(e) => setLeadOwner(e.target.value)}
                    placeholder="Owner name"
                    style={inputStyle}
                  />
                  <input
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="Phone"
                    style={inputStyle}
                  />
                </div>
                <div style={actionsStyle}>
                  <ActionButton onClick={closeModal}>Cancel</ActionButton>
                  <ActionButton onClick={handleCreateLead} tone="gold">
                    {saving ? "Creating..." : "Create Lead"}
                  </ActionButton>
                </div>
              </>
            )}

            {open === "task" && (
              <>
                <div style={titleStyle}>Create Task</div>
                <div style={formStyle}>
                  <input
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Task title"
                    style={inputStyle}
                  />
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="low">Low priority</option>
                    <option value="medium">Medium priority</option>
                    <option value="high">High priority</option>
                  </select>
                </div>
                <div style={actionsStyle}>
                  <ActionButton onClick={closeModal}>Cancel</ActionButton>
                  <ActionButton onClick={handleCreateTask} tone="gold">
                    {saving ? "Creating..." : "Create Task"}
                  </ActionButton>
                </div>
              </>
            )}

            {open === "buyer" && (
              <>
                <div style={titleStyle}>Create Buyer</div>
                <div style={formStyle}>
                  <input
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Buyer name"
                    style={inputStyle}
                  />
                  <input
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="Email"
                    style={inputStyle}
                  />
                  <input
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="Phone"
                    style={inputStyle}
                  />
                </div>
                <div style={actionsStyle}>
                  <ActionButton onClick={closeModal}>Cancel</ActionButton>
                  <ActionButton onClick={handleCreateBuyer} tone="gold">
                    {saving ? "Creating..." : "Create Buyer"}
                  </ActionButton>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}

const barStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(3,6,12,0.56)",
  backdropFilter: "blur(8px)",
  display: "grid",
  placeItems: "center",
  zIndex: 1000,
  padding: 24,
}

const modalStyle: CSSProperties = {
  width: "100%",
  maxWidth: 520,
  borderRadius: 24,
  border: "1px solid rgba(255,255,255,0.08)",
  background:
    "linear-gradient(180deg, rgba(18,21,28,0.98) 0%, rgba(12,14,20,0.98) 100%)",
  boxShadow:
    "0 24px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
  padding: 20,
  color: "#fff",
}

const titleStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 14,
}

const formStyle: CSSProperties = {
  display: "grid",
  gap: 12,
}

const inputStyle: CSSProperties = {
  width: "100%",
  height: 46,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  padding: "0 14px",
  outline: "none",
}

const actionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 18,
}