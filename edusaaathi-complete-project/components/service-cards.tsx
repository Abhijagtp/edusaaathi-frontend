import Link from "next/link";
import { EnquiryTrigger } from "@/components/enquiry-trigger";
import {
  ArrowRightIcon,
  GraduationCapIcon,
  BookOpenIcon,
  UniversityIcon,
  ClipboardCheckIcon,
} from "@/components/icons";

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: typeof GraduationCapIcon;
  theme: "counselling" | "courses" | "university" | "admission";
  actionType: "enquiry" | "courses-link" | "apply-link";
  actionLabel: string;
  href?: string;
}

const SERVICES: ServiceItem[] = [
  {
    id: "free-counselling",
    title: "Free Education Counselling",
    description:
      "Get personalised guidance to understand your interests, qualifications, and the education options that suit your goals.",
    icon: GraduationCapIcon,
    theme: "counselling",
    actionType: "enquiry",
    actionLabel: "Get Free Counselling",
  },
  {
    id: "course-selection",
    title: "Course Selection",
    description:
      "Explore courses, understand eligibility requirements, and find the right academic path for your future.",
    icon: BookOpenIcon,
    theme: "courses",
    actionType: "courses-link",
    actionLabel: "Explore Courses",
    href: "/courses",
  },
  {
    id: "university-guidance",
    title: "University & Board Guidance",
    description:
      "Get assistance in exploring universities, colleges, and education boards to make informed decisions.",
    icon: UniversityIcon,
    theme: "university",
    actionType: "enquiry",
    actionLabel: "Get University Guidance",
  },
  {
    id: "admission-assistance",
    title: "Admission Assistance",
    description:
      "Get support with admission enquiries and understand the next steps in your education journey.",
    icon: ClipboardCheckIcon,
    theme: "admission",
    actionType: "apply-link",
    actionLabel: "Admission Assistance",
    href: "/apply",
  },
];

export function ServiceCard({ service, index }: { service: ServiceItem; index: number }) {
  const IconComponent = service.icon;

  const renderAction = () => {
    if (service.actionType === "enquiry") {
      return (
        <EnquiryTrigger className="service-card__action" aria-label={`${service.actionLabel} for ${service.title}`}>
          <span>{service.actionLabel}</span>
          <ArrowRightIcon aria-hidden="true" />
        </EnquiryTrigger>
      );
    }

    if (service.href) {
      return (
        <Link
          href={service.href}
          className="service-card__action"
          aria-label={`${service.actionLabel} for ${service.title}`}
        >
          <span>{service.actionLabel}</span>
          <ArrowRightIcon aria-hidden="true" />
        </Link>
      );
    }

    return null;
  };

  return (
    <article
      className={`service-card service-card--${service.theme}`}
      data-reveal-item
      tabIndex={0}
      aria-labelledby={`service-title-${service.id}`}
    >
      <div className="service-card__badge-row">
        <div className="service-card__icon-wrap" aria-hidden="true">
          <IconComponent />
        </div>
        <span className="service-card__number" aria-hidden="true">0{index + 1}</span>
      </div>

      <h3 id={`service-title-${service.id}`} className="service-card__title">
        {service.title}
      </h3>

      <p className="service-card__description">{service.description}</p>

      <div className="service-card__foot">{renderAction()}</div>
    </article>
  );
}

export function ServiceCards() {
  return (
    <section
      id="services"
      className="services-section section-pad"
      aria-labelledby="services-title"
    >
      <div className="page-wrap">
        <div className="section-heading section-heading--centered" data-reveal>
          <p className="eyebrow">
            <span className="eyebrow__dot" /> OUR SERVICES
          </p>
          <h2 id="services-title">
            Everything You Need to Make the{" "}
            <em>Right Education Decision</em>
          </h2>
          <p className="services-section__lead">
            From choosing the right course to getting admission guidance, we&apos;re here to
            simplify every step.
          </p>
        </div>

        <div className="services-grid" data-reveal-sequence>
          {SERVICES.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
