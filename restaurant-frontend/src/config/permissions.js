/**
 * Central role → section permission map.
 * Each key is a sidebar / route section identifier.
 * The value is an array of roles allowed to access it.
 */

export const ROLES = {
    ADMIN: "Admin",
    MANAGER: "Manager",
    CHEF: "Chef",
    STAFF: "Staff",
    // Legacy roles from existing system mapped to closest new role
    HEAD_CHEF: "Head Chef",
    WAITER: "Waiter",
};

const SECTION_PERMISSIONS = {
    dashboard: [ROLES.ADMIN, ROLES.MANAGER, ROLES.HEAD_CHEF],
    analytics: [ROLES.ADMIN, ROLES.MANAGER, ROLES.HEAD_CHEF],
    userManagement: [ROLES.ADMIN, ROLES.MANAGER],
    forms: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CHEF, ROLES.STAFF, ROLES.HEAD_CHEF],
    menu: [ROLES.ADMIN, ROLES.CHEF, ROLES.HEAD_CHEF],
    recipes: [ROLES.ADMIN, ROLES.CHEF, ROLES.HEAD_CHEF],
    inventory: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CHEF, ROLES.HEAD_CHEF],
    roster: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CHEF, ROLES.STAFF, ROLES.HEAD_CHEF, ROLES.WAITER],
    profile: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CHEF, ROLES.STAFF, ROLES.HEAD_CHEF, ROLES.WAITER],
    settings: [ROLES.ADMIN, ROLES.MANAGER],
    pos: [ROLES.ADMIN, ROLES.MANAGER, ROLES.WAITER],
    sales: [ROLES.ADMIN, ROLES.MANAGER, ROLES.WAITER],
    reservations: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CHEF, ROLES.HEAD_CHEF, ROLES.WAITER, ROLES.STAFF],
};

/**
 * Check whether a given role has access to a section.
 * @param {string|null} role - current user role
 * @param {string} section - section key from SECTION_PERMISSIONS
 * @returns {boolean}
 */
export function hasPermission(role, section) {
    if (!role) return false;
    const allowed = SECTION_PERMISSIONS[section];
    if (!allowed) return false;
    return allowed.includes(role);
}

export default SECTION_PERMISSIONS;
