import { useState, useEffect, useMemo } from "react";
import { getPatients } from "../services/patientService";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
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
  UsersIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  XIcon,
  EyeIcon,
} from "../components/ui/Icons";

/**
 * Derives a clean 2-letter initials string from a patient's name.
 * e.g., "John Doe" -> "JD", "Sarah" -> "SA"
 */
function getPatientInitials(name) {
  if (!name) return "PT";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "PT";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Helper: format "YYYY-MM-DD" -> "MMM D, YYYY"
 */
function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    const [year, month, day] = dateString.split("-");
    if (!year || !month || !day) return dateString;
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * CarePulse HMS — Admin Patients Directory (Batch 13)
 *
 * Authenticated Administrator Read-Only Patient Directory.
 * Displays only authentic PatientResponse fields: id, name, email, phone, dateOfBirth.
 * Strictly read-only: No patient CRUD or fabricated data.
 */
export function Patients() {
  // Data & Pagination state
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pageNo, setPageNo] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Details Modal state
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Load patients from backend
  const loadPatientsData = async (targetPage = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPatients(targetPage, pageSize);
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

      setPatients(list);
      setTotalElements(total);
      setTotalPages(pages);
      setPageNo(targetPage);
    } catch (err) {
      console.error("Failed to load patient directory:", err);
      setError("Unable to retrieve patient directory. Please verify your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientsData(0);
  }, []);

  // Client-side search against the currently loaded page
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients;
    const query = searchTerm.trim().toLowerCase();

    return patients.filter((patient) => {
      const idMatch = String(patient.id || "").toLowerCase().includes(query);
      const nameMatch = (patient.name || "").toLowerCase().includes(query);
      const emailMatch = (patient.email || "").toLowerCase().includes(query);
      const phoneMatch = (patient.phone || "").toLowerCase().includes(query);
      return idMatch || nameMatch || emailMatch || phoneMatch;
    });
  }, [patients, searchTerm]);

  const isFilterActive = Boolean(searchTerm.trim());

  const handleClearFilters = () => {
    setSearchTerm("");
  };

  const handlePageChange = (newPage) => {
    loadPatientsData(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="cp-patients-container">
      {/* ── Page Header (Read-Only: No Add Patient button) ── */}
      <PageHeader
        title="Patients"
        description="Comprehensive directory of registered patients and clinical user records."
      />

      {/* ── Search & Filter Controls ── */}
      <section className="cp-patients-toolbar" aria-label="Search patient directory">
        <div className="cp-patients-filters-row">
          <div className="cp-patients-search-wrapper">
            <label htmlFor="patient-search" className="cp-sr-only">
              Search patients by name, email, phone, or ID
            </label>
            <Input
              id="patient-search"
              placeholder="Search patients by name, email, phone, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              iconPrefix={<SearchIcon size={18} />}
              disabled={loading || Boolean(error)}
              aria-label="Search patients"
            />
          </div>

          {isFilterActive && (
            <Button
              variant="ghost"
              size="md"
              onClick={handleClearFilters}
              icon={<XIcon size={16} />}
              id="clear-patients-filter-btn"
              aria-label="Clear active patient search filter"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Results Metadata & Search Context (Communicates scope clearly) */}
        {!loading && !error && patients.length > 0 && (
          <div className="cp-patients-results-meta">
            <span>
              {totalPages > 1 ? (
                <>
                  Showing <strong>{filteredPatients.length}</strong> matching of{" "}
                  <strong>{patients.length}</strong> patient(s) on page <strong>{pageNo + 1}</strong> of{" "}
                  <strong>{totalPages}</strong> ({totalElements} total in directory)
                </>
              ) : (
                <>
                  Showing <strong>{filteredPatients.length}</strong> of{" "}
                  <strong>{totalElements}</strong> registered patient(s)
                </>
              )}
            </span>

            {isFilterActive && (
              <button
                type="button"
                className="cp-patients-clear-btn"
                onClick={handleClearFilters}
              >
                Reset search query
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── Main Content Area (Loading / Error / Empty / Ledger) ── */}
      {loading ? (
        <Card className="cp-patients-table-card">
          <SkeletonTable rows={5} columns={6} />
        </Card>
      ) : error ? (
        <ErrorState
          title="Failed to Load Patients"
          description={error}
          onRetry={() => loadPatientsData(pageNo)}
          retryLabel="Reload Patients"
        />
      ) : patients.length === 0 ? (
        <Card>
          <EmptyState
            icon={<UsersIcon size={36} />}
            title="No Patients Registered"
            description="There are currently no patients registered in the hospital management system."
          />
        </Card>
      ) : filteredPatients.length === 0 ? (
        <Card>
          <EmptyState
            icon={<SearchIcon size={36} />}
            title="No Matching Patients"
            description="No patients matched your search query. Try adjusting your search term."
            action={
              <Button
                variant="outline"
                size="md"
                onClick={handleClearFilters}
                id="empty-clear-patients-btn"
              >
                Clear Filters
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {/* ── Desktop Tabular View (>= 768px) ── */}
          <div className="cp-patients-desktop-view">
            <div className="cp-patients-table-card">
              <Table aria-label="Hospital patients directory">
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ width: "90px" }}>ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead style={{ textAlign: "right", width: "110px" }}>
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => {
                    const initials = getPatientInitials(patient.name);

                    return (
                      <TableRow key={patient.id} id={`patient-row-${patient.id}`}>
                        <TableCell>
                          <span
                            style={{
                              fontWeight: "var(--cp-font-weight-medium)",
                              color: "var(--cp-text-muted)",
                            }}
                          >
                            #{patient.id}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div className="cp-patient-avatar" aria-hidden="true">
                              {initials}
                            </div>
                            <strong style={{ color: "var(--cp-text-primary)" }}>
                              {patient.name || "Unnamed Patient"}
                            </strong>
                          </div>
                        </TableCell>
                        <TableCell>
                          {patient.email ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.375rem",
                                color: "var(--cp-text-secondary)",
                              }}
                            >
                              <MailIcon size={14} style={{ color: "var(--cp-text-muted)" }} aria-hidden="true" />
                              <span>{patient.email}</span>
                            </span>
                          ) : (
                            <span style={{ color: "var(--cp-text-muted)" }}>—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {patient.phone ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.375rem",
                                color: "var(--cp-text-secondary)",
                              }}
                            >
                              <PhoneIcon size={14} style={{ color: "var(--cp-text-muted)" }} aria-hidden="true" />
                              <span>{patient.phone}</span>
                            </span>
                          ) : (
                            <span style={{ color: "var(--cp-text-muted)" }}>—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {patient.dateOfBirth ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.375rem",
                                color: "var(--cp-text-secondary)",
                              }}
                            >
                              <CalendarIcon size={14} style={{ color: "var(--cp-text-muted)" }} aria-hidden="true" />
                              <span>{formatDate(patient.dateOfBirth)}</span>
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
                            onClick={() => setSelectedPatient(patient)}
                            aria-label={`View details for ${patient.name}`}
                            id={`view-patient-${patient.id}`}
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
          <div className="cp-patients-mobile-view">
            <div className="cp-patients-mobile-stack" aria-label="Patients list">
              {filteredPatients.map((patient) => {
                const initials = getPatientInitials(patient.name);

                return (
                  <div key={patient.id} className="cp-patient-card" id={`patient-card-${patient.id}`}>
                    <div className="cp-patient-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div className="cp-patient-avatar" aria-hidden="true">
                          {initials}
                        </div>
                        <div>
                          <span style={{ fontSize: "var(--cp-font-size-xs)", color: "var(--cp-text-muted)" }}>
                            ID #{patient.id}
                          </span>
                          <h3 className="cp-patient-card-name">
                            {patient.name || "Unnamed Patient"}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <div className="cp-patient-card-details">
                      <div className="cp-patient-contact-item">
                        <MailIcon size={15} aria-hidden="true" />
                        <span className="cp-patient-contact-text">
                          {patient.email || "No email on record"}
                        </span>
                      </div>
                      <div className="cp-patient-contact-item">
                        <PhoneIcon size={15} aria-hidden="true" />
                        <span className="cp-patient-contact-text">
                          {patient.phone || "No phone on record"}
                        </span>
                      </div>
                      <div className="cp-patient-contact-item">
                        <CalendarIcon size={15} aria-hidden="true" />
                        <span className="cp-patient-contact-text">
                          DOB: {formatDate(patient.dateOfBirth)}
                        </span>
                      </div>
                    </div>

                    <div className="cp-patient-card-footer">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<EyeIcon size={16} />}
                        onClick={() => setSelectedPatient(patient)}
                        fullWidth
                        id={`mobile-view-patient-${patient.id}`}
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

      {/* ── Patient Details Modal (Strictly Read-Only) ── */}
      {selectedPatient && (
        <Modal
          isOpen={Boolean(selectedPatient)}
          onClose={() => setSelectedPatient(null)}
          title="Patient Details"
          description={`Patient Registry Reference #${selectedPatient.id}`}
          size="md"
        >
          <div className="cp-patient-detail-grid">
            <div className="cp-patient-detail-item">
              <span className="cp-patient-detail-label">Patient ID</span>
              <span className="cp-patient-detail-value">#{selectedPatient.id}</span>
            </div>

            <div className="cp-patient-detail-item">
              <span className="cp-patient-detail-label">Full Name</span>
              <span className="cp-patient-detail-value">
                {selectedPatient.name || "—"}
              </span>
            </div>

            <div className="cp-patient-detail-item">
              <span className="cp-patient-detail-label">Email Address</span>
              <span className="cp-patient-detail-value">
                {selectedPatient.email || "—"}
              </span>
            </div>

            <div className="cp-patient-detail-item">
              <span className="cp-patient-detail-label">Phone Number</span>
              <span className="cp-patient-detail-value">
                {selectedPatient.phone || "—"}
              </span>
            </div>

            <div className="cp-patient-detail-item" style={{ gridColumn: "1 / -1" }}>
              <span className="cp-patient-detail-label">Date of Birth</span>
              <span className="cp-patient-detail-value">
                {formatDate(selectedPatient.dateOfBirth)}
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
              onClick={() => setSelectedPatient(null)}
              id="modal-close-patient-btn"
            >
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Patients;
