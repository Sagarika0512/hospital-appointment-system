import { useState, useEffect, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getDoctors } from "../services/doctorService";
import { AdminDoctors } from "./AdminDoctors";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Pagination } from "../components/ui/Pagination";
import { SkeletonCard } from "../components/feedback/Skeleton";
import { EmptyState } from "../components/feedback/EmptyState";
import { ErrorState } from "../components/feedback/ErrorState";
import {
  SearchIcon,
  StethoscopeIcon,
  MailIcon,
  PhoneIcon,
  CalendarPlusIcon,
  XIcon,
} from "../components/ui/Icons";

/**
 * Derives a clean 2-letter initials string from a doctor's name.
 * e.g., "Dr. Sarah Connor" -> "SC", "Dr. Sharma" -> "SH", "John" -> "JO"
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

export function Doctors() {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "ADMIN" || user?.role === "ROLE_ADMIN";

  if (isAdmin) {
    return <AdminDoctors />;
  }

  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state (backend-driven)
  const [pageNo, setPageNo] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12; // Capped comfortably below backend limit of 50

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");

  const loadDoctorsData = async (targetPage = 0) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getDoctors(targetPage, pageSize);
      const list = Array.isArray(response)
        ? response
        : response?.content || [];

      const total = typeof response?.totalElements === "number"
        ? response.totalElements
        : list.length;

      const pages = typeof response?.totalPages === "number"
        ? response.totalPages
        : 1;

      setDoctors(list);
      setTotalElements(total);
      setTotalPages(pages);
      setPageNo(targetPage);
    } catch (err) {
      console.error("Failed to load doctor directory:", err);
      setError("Unable to retrieve the doctor directory. Please verify your connection and try again.");
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

  // Client-side filtering of loaded doctor records
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const nameMatch =
        !searchTerm.trim() ||
        (doc.name || "").toLowerCase().includes(searchTerm.toLowerCase().trim());

      const specialtyMatch =
        !selectedSpecialty ||
        (doc.specialization || "").toLowerCase() === selectedSpecialty.toLowerCase();

      return nameMatch && specialtyMatch;
    });
  }, [doctors, searchTerm, selectedSpecialty]);

  const isFilterActive = Boolean(searchTerm.trim() || selectedSpecialty);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedSpecialty("");
  };

  const handlePageChange = (newPage) => {
    loadDoctorsData(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBookAppointment = (doctor) => {
    navigate(`/book-appointment?doctorId=${doctor.id}`, {
      state: {
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialization: doctor.specialization,
      },
    });
  };

  return (
    <div className="cp-doctors-container">
      {/* ── Page Header ── */}
      <PageHeader
        title="Find a Doctor"
        description="Browse qualified medical specialists, review credentials, and schedule your appointment."
      />

      {/* ── Search & Filter Controls ── */}
      <section className="cp-doctors-toolbar" aria-label="Search and filter doctor directory">
        <div className="cp-doctors-filters-row">
          <div className="cp-doctors-search-wrapper">
            <label htmlFor="doctor-search" className="cp-sr-only">
              Search doctors by name
            </label>
            <Input
              id="doctor-search"
              placeholder="Search doctors by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              iconPrefix={<SearchIcon size={18} />}
              disabled={loading || Boolean(error)}
              aria-label="Search doctors by name"
            />
          </div>

          <div className="cp-doctors-select-wrapper">
            <label htmlFor="specialty-filter" className="cp-sr-only">
              Filter by specialization
            </label>
            <Select
              id="specialty-filter"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              placeholder=""
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
              aria-label="Clear active search and specialization filters"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Results Metadata & Search Context */}
        {!loading && !error && doctors.length > 0 && (
          <div className="cp-doctors-results-meta">
            <span>
              {totalPages > 1 ? (
                <>
                  Showing <strong>{filteredDoctors.length}</strong> matching specialists on page{" "}
                  <strong>{pageNo + 1}</strong> of <strong>{totalPages}</strong> ({totalElements} total in directory)
                </>
              ) : (
                <>
                  Showing <strong>{filteredDoctors.length}</strong> of <strong>{totalElements}</strong> medical specialists
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

      {/* ── Main Content Area (Loading / Error / Empty / Grid) ── */}
      {loading ? (
        <section aria-label="Loading doctor directory" className="cp-doctors-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </section>
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
            icon={<StethoscopeIcon size={32} />}
            title="No Doctors Available"
            description="There are currently no healthcare specialists registered in the hospital directory."
          />
        </Card>
      ) : filteredDoctors.length === 0 ? (
        <Card>
          <EmptyState
            icon={<SearchIcon size={32} />}
            title="No Matching Doctors"
            description="No doctors matched your search criteria. Try adjusting your name query or selecting a different specialization."
            action={
              <Button variant="outline" size="md" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <section className="cp-doctors-grid" aria-label="Available doctors list">
            {filteredDoctors.map((doctor) => {
              const displayName = formatDoctorName(doctor.name);
              const initials = getDoctorInitials(doctor.name);

              return (
                <div key={doctor.id} className="cp-doctor-card">
                  <div className="cp-doctor-card-top">
                    {/* Header: Initials Avatar + Name & Specialization */}
                    <div className="cp-doctor-card-header">
                      <div className="cp-doctor-avatar" aria-hidden="true">
                        {initials}
                      </div>
                      <div className="cp-doctor-header-info">
                        <h2 className="cp-doctor-name" title={displayName}>
                          {displayName}
                        </h2>
                        {doctor.specialization && (
                          <div className="cp-doctor-specialty-badge">
                            <StethoscopeIcon size={14} aria-hidden="true" />
                            <span>{doctor.specialization}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="cp-doctor-contact-list">
                      {doctor.email ? (
                        <div className="cp-doctor-contact-item" title={doctor.email}>
                          <MailIcon size={16} aria-hidden="true" />
                          <span className="cp-doctor-contact-text">{doctor.email}</span>
                        </div>
                      ) : (
                        <div className="cp-doctor-contact-item">
                          <MailIcon size={16} aria-hidden="true" />
                          <span className="cp-doctor-contact-text cp-text-muted">No email on record</span>
                        </div>
                      )}

                      {doctor.phone ? (
                        <div className="cp-doctor-contact-item" title={doctor.phone}>
                          <PhoneIcon size={16} aria-hidden="true" />
                          <span className="cp-doctor-contact-text">{doctor.phone}</span>
                        </div>
                      ) : (
                        <div className="cp-doctor-contact-item">
                          <PhoneIcon size={16} aria-hidden="true" />
                          <span className="cp-doctor-contact-text cp-text-muted">No phone on record</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer: Book Appointment CTA */}
                  <div className="cp-doctor-card-footer">
                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      icon={<CalendarPlusIcon size={16} />}
                      onClick={() => handleBookAppointment(doctor)}
                      aria-label={`Book appointment with ${displayName}`}
                    >
                      Book Appointment
                    </Button>
                  </div>
                </div>
              );
            })}
          </section>

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
    </div>
  );
}

export default Doctors;