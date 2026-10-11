import { useState, useEffect, useMemo } from "react";
import { getDoctors } from "../services/doctorService";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Pagination } from "../components/ui/Pagination";
import { Modal } from "../components/ui/Modal";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "../components/ui/Table";
import { SkeletonTable } from "../components/feedback/Skeleton";
import { EmptyState } from "../components/feedback/EmptyState";
import { ErrorState } from "../components/feedback/ErrorState";
import {
  SearchIcon,
  StethoscopeIcon,
  MailIcon,
  PhoneIcon,
  XIcon,
  EyeIcon,
} from "../components/ui/Icons";

/**
 * Derives a clean 2-letter initials string from a doctor's name.
 * e.g., "Dr. Sarah Connor" -> "SC", "Dr. Sharma" -> "SH"
 */
function getDoctorInitials(name) {
  if (!name) return "DR";
  const clean = name.replace(/^dr\.?\s+/i, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "DR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Ensures "Dr." prefix is formatted cleanly for display.
 */
function formatDoctorName(name) {
  if (!name) return "Doctor";
  const trimmed = name.trim();
  return trimmed.toLowerCase().startsWith("dr.") ? trimmed : `Dr. ${trimmed}`;
}

/**
 * CarePulse HMS — Admin Doctors Page (Batch 12)
 *
 * Authenticated Administrator Read-Only Doctor Directory.
 * Displays only authentic DoctorResponse fields: id, name, specialization, email, phone.
 * No CRUD actions or fabricated information.
 */
export function AdminDoctors() {
  // Data & Pagination state
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pageNo, setPageNo] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");

  // Details Modal state
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Load doctors from backend
  const loadDoctorsData = async (targetPage = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDoctors(targetPage, pageSize);
      const list = Array.isArray(response)
        ? response
        : response?.content || [];

      const total =
        typeof response?.totalElements === "number"
          ? response.totalElements
          : list.length;

      const pages =
        typeof response?.totalPages === "number"
          ? response.totalPages
          : 1;

      setDoctors(list);
      setTotalElements(total);
      setTotalPages(pages);
      setPageNo(targetPage);
    } catch (err) {
      console.error("Failed to load doctor directory:", err);
      setError("Unable to retrieve doctor directory. Please verify your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorsData(0);
  }, []);

  // Derive specialization dropdown options dynamically from loaded records
  const specializationOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        doctors
          .map((doc) => doc.specialization?.trim())
          .filter(Boolean)
      )
    ).sort();

    return [
      { value: "", label: "All Specializations" },
      ...unique.map((spec) => ({ value: spec, label: spec })),
    ];
  }, [doctors]);

  // Client-side search and specialization filter on loaded page
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      // 1. Specialization Filter
      if (selectedSpecialty) {
        if ((doc.specialization || "").toLowerCase() !== selectedSpecialty.toLowerCase()) {
          return false;
        }
      }

      // 2. Search Term Filter (ID, Name, Specialization, Email, Phone)
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const idMatch = String(doc.id || "").toLowerCase().includes(query);
        const nameMatch = String(doc.name || "").toLowerCase().includes(query);
        const specMatch = String(doc.specialization || "").toLowerCase().includes(query);
        const emailMatch = String(doc.email || "").toLowerCase().includes(query);
        const phoneMatch = String(doc.phone || "").toLowerCase().includes(query);
        return idMatch || nameMatch || specMatch || emailMatch || phoneMatch;
      }

      return true;
    });
  }, [doctors, selectedSpecialty, searchTerm]);

  const isFilterActive = Boolean(searchTerm.trim() || selectedSpecialty);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedSpecialty("");
  };

  const handlePageChange = (newPage) => {
    loadDoctorsData(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="cp-doctors-container">
      {/* ── Page Header (Read-Only: No Add Doctor button) ── */}
      <PageHeader
        title="Doctors"
        description="Comprehensive directory of credentialed medical practitioners and specialists across the hospital."
      />

      {/* ── Search & Filter Controls ── */}
      <section className="cp-doctors-toolbar" aria-label="Search and filter doctor directory">
        <div className="cp-doctors-filters-row">
          <div className="cp-doctors-search-wrapper">
            <label htmlFor="admin-doctor-search" className="cp-sr-only">
              Search doctors by name, specialization, email, or phone
            </label>
            <Input
              id="admin-doctor-search"
              placeholder="Search doctors by name, specialty, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              iconPrefix={<SearchIcon size={18} />}
              disabled={loading || Boolean(error)}
              aria-label="Search doctors"
            />
          </div>

          <div className="cp-doctors-select-wrapper">
            <label htmlFor="admin-specialty-filter" className="cp-sr-only">
              Filter by specialization
            </label>
            <Select
              id="admin-specialty-filter"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              disabled={loading || Boolean(error) || specializationOptions.length <= 1}
              aria-label="Filter by specialization"
            >
              {specializationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          {isFilterActive && (
            <Button
              variant="ghost"
              size="md"
              onClick={handleClearFilters}
              icon={<XIcon size={16} />}
              id="clear-filters-btn"
              aria-label="Clear active search and specialization filters"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Results Metadata & Search Context (Clearly communicates scope) */}
        {!loading && !error && doctors.length > 0 && (
          <div className="cp-doctors-results-meta">
            <span>
              {totalPages > 1 ? (
                <>
                  Showing <strong>{filteredDoctors.length}</strong> matching of{" "}
                  <strong>{doctors.length}</strong> doctor(s) on page <strong>{pageNo + 1}</strong> of{" "}
                  <strong>{totalPages}</strong> ({totalElements} total in directory)
                </>
              ) : (
                <>
                  Showing <strong>{filteredDoctors.length}</strong> of{" "}
                  <strong>{totalElements}</strong> registered physician(s)
                </>
              )}
            </span>

            {isFilterActive && (
              <button
                type="button"
                className="cp-doctors-clear-btn"
                onClick={handleClearFilters}
              >
                Reset search filters
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── Main Content Area (Loading / Error / Empty / Ledger) ── */}
      {loading ? (
        <Card className="cp-doctors-admin-table-card">
          <SkeletonTable rows={5} columns={6} />
        </Card>
      ) : error ? (
        <ErrorState
          title="Failed to Load Doctors"
          description={error}
          onRetry={() => loadDoctorsData(pageNo)}
          retryLabel="Reload Doctors"
        />
      ) : doctors.length === 0 ? (
        <Card>
          <EmptyState
            icon={<StethoscopeIcon size={36} />}
            title="No Doctors Registered"
            description="There are currently no healthcare specialists registered in the hospital directory."
          />
        </Card>
      ) : filteredDoctors.length === 0 ? (
        <Card>
          <EmptyState
            icon={<SearchIcon size={36} />}
            title="No Matching Doctors"
            description="No doctors matched your search criteria. Try adjusting your query or selecting a different specialization."
            action={
              <Button
                variant="outline"
                size="md"
                onClick={handleClearFilters}
                id="empty-clear-filters-btn"
              >
                Clear Filters
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {/* ── Desktop Tabular View (>= 768px) ── */}
          <div className="cp-doctors-admin-desktop-view">
            <div className="cp-doctors-admin-table-card">
              <Table aria-label="Hospital doctors directory">
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ width: "90px" }}>ID</TableHead>
                    <TableHead>Physician</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead style={{ textAlign: "right", width: "110px" }}>
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDoctors.map((doctor) => {
                    const displayName = formatDoctorName(doctor.name);
                    const initials = getDoctorInitials(doctor.name);

                    return (
                      <TableRow key={doctor.id} id={`doctor-row-${doctor.id}`}>
                        <TableCell>
                          <span
                            style={{
                              fontWeight: "var(--cp-font-weight-medium)",
                              color: "var(--cp-text-muted)",
                            }}
                          >
                            #{doctor.id}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div
                              className="cp-doctor-avatar"
                              style={{ width: "36px", height: "36px", fontSize: "0.85rem" }}
                              aria-hidden="true"
                            >
                              {initials}
                            </div>
                            <strong style={{ color: "var(--cp-text-primary)" }}>
                              {displayName}
                            </strong>
                          </div>
                        </TableCell>
                        <TableCell>
                          {doctor.specialization ? (
                            <div className="cp-doctor-specialty-badge" style={{ marginTop: 0 }}>
                              <StethoscopeIcon size={13} aria-hidden="true" />
                              <span>{doctor.specialization}</span>
                            </div>
                          ) : (
                            <span style={{ color: "var(--cp-text-muted)" }}>—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {doctor.email ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.375rem",
                                color: "var(--cp-text-secondary)",
                              }}
                            >
                              <MailIcon size={14} style={{ color: "var(--cp-text-muted)" }} aria-hidden="true" />
                              <span>{doctor.email}</span>
                            </span>
                          ) : (
                            <span style={{ color: "var(--cp-text-muted)" }}>—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {doctor.phone ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.375rem",
                                color: "var(--cp-text-secondary)",
                              }}
                            >
                              <PhoneIcon size={14} style={{ color: "var(--cp-text-muted)" }} aria-hidden="true" />
                              <span>{doctor.phone}</span>
                            </span>
                          ) : (
                            <span style={{ color: "var(--cp-text-muted)" }}>—</span>
                          )}
                        </TableCell>
                        <TableCell style={{ textAlign: "right" }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<EyeIcon size={15} />}
                            onClick={() => setSelectedDoctor(doctor)}
                            aria-label={`View details for ${displayName}`}
                            id={`view-doctor-${doctor.id}`}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* ── Mobile Card Stack View (< 768px) ── */}
          <div className="cp-doctors-admin-mobile-view">
            <div className="cp-doctors-admin-mobile-stack" aria-label="Doctors list">
              {filteredDoctors.map((doctor) => {
                const displayName = formatDoctorName(doctor.name);
                const initials = getDoctorInitials(doctor.name);

                return (
                  <div key={doctor.id} className="cp-doctor-admin-card" id={`doctor-card-${doctor.id}`}>
                    <div className="cp-doctor-admin-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div className="cp-doctor-avatar" aria-hidden="true">
                          {initials}
                        </div>
                        <div>
                          <span style={{ fontSize: "var(--cp-font-size-xs)", color: "var(--cp-text-muted)" }}>
                            ID #{doctor.id}
                          </span>
                          <h3 className="cp-doctor-name" style={{ fontSize: "1rem" }}>
                            {displayName}
                          </h3>
                        </div>
                      </div>
                      {doctor.specialization && (
                        <div className="cp-doctor-specialty-badge" style={{ marginTop: 0 }}>
                          <span>{doctor.specialization}</span>
                        </div>
                      )}
                    </div>

                    <div className="cp-doctor-admin-card-contact">
                      <div className="cp-doctor-contact-item">
                        <MailIcon size={15} aria-hidden="true" />
                        <span className="cp-doctor-contact-text">
                          {doctor.email || "No email on record"}
                        </span>
                      </div>
                      <div className="cp-doctor-contact-item">
                        <PhoneIcon size={15} aria-hidden="true" />
                        <span className="cp-doctor-contact-text">
                          {doctor.phone || "No phone on record"}
                        </span>
                      </div>
                    </div>

                    <div className="cp-doctor-admin-card-footer">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<EyeIcon size={16} />}
                        onClick={() => setSelectedDoctor(doctor)}
                        fullWidth
                        id={`mobile-view-doctor-${doctor.id}`}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Pagination (Server-Driven) ── */}
          {totalPages > 1 && (
            <div style={{ marginTop: "0.5rem" }}>
              <Pagination
                pageNo={pageNo}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                disabled={loading}
              />
            </div>
          )}
        </>
      )}

      {/* ── Doctor Details Modal (Read-Only) ── */}
      {selectedDoctor && (
        <Modal
          isOpen={Boolean(selectedDoctor)}
          onClose={() => setSelectedDoctor(null)}
          title="Doctor Details"
          description={`Physician Registry Reference #${selectedDoctor.id}`}
          size="md"
        >
          <div className="cp-doctor-detail-grid">
            <div className="cp-doctor-detail-item">
              <span className="cp-doctor-detail-label">Doctor ID</span>
              <span className="cp-doctor-detail-value">#{selectedDoctor.id}</span>
            </div>

            <div className="cp-doctor-detail-item">
              <span className="cp-doctor-detail-label">Full Name</span>
              <span className="cp-doctor-detail-value">
                {formatDoctorName(selectedDoctor.name)}
              </span>
            </div>

            <div className="cp-doctor-detail-item">
              <span className="cp-doctor-detail-label">Specialization</span>
              <span className="cp-doctor-detail-value">
                {selectedDoctor.specialization || "General Medicine"}
              </span>
            </div>

            <div className="cp-doctor-detail-item">
              <span className="cp-doctor-detail-label">Email Address</span>
              <span className="cp-doctor-detail-value">
                {selectedDoctor.email || "—"}
              </span>
            </div>

            <div className="cp-doctor-detail-item" style={{ gridColumn: "1 / -1" }}>
              <span className="cp-doctor-detail-label">Phone Number</span>
              <span className="cp-doctor-detail-value">
                {selectedDoctor.phone || "—"}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "1.5rem",
            }}
          >
            <Button
              variant="primary"
              size="md"
              onClick={() => setSelectedDoctor(null)}
              id="modal-close-doctor-btn"
            >
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default AdminDoctors;
